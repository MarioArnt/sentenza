#!/usr/bin/env node

/* eslint-disable no-console */
import { program, ParsedOptions, CaporalValidator } from '@caporal/core';
import { printVersion, Sentenza } from 'sentenza';
import { SentenzaBitbucket, SentenzaBitbucketPipeline } from '..';
import ora from 'ora';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { HTTPError } from 'got';
import { IPipelineDetails } from '../bitbucket-api';

const version = () => JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json')).toString()).version;

program.version(printVersion({ name: 'Bitbucket provider', version: version() }));

const conflictingOptions = (cmd: ParsedOptions, options: string[]) => {
  let defined = 0;
  options.forEach((option) => {
    if (cmd[option]) {
      defined++;
    }
  });
  if (defined > 1) {
    console.error(
      'Conflicting options. Please only use one of the following option: ' +
        options.map((option) => '--' + option).join(', '),
    );
    process.exit(1);
  }
};

const printError = (e: Error) => {
  console.error(chalk.red(e));
  if (e instanceof HTTPError) {
    console.error(chalk.red(e.response.body));
  }
};

const triggerPipeline = (
  trigger: string,
  cmd: ParsedOptions,
): { pipeline: Promise<SentenzaBitbucketPipeline>; sentenza: SentenzaBitbucket } => {
  let sentenza = Sentenza.provider<SentenzaBitbucket>('bitbucket');
  if (cmd.auth) {
    const credentials = cmd.auth.toString().split(':');
    sentenza = sentenza.auth({
      username: credentials[0],
      app_password: credentials[1],
    });
  }
  sentenza = sentenza.repository(cmd.repository.toString());

  conflictingOptions(cmd, ['commit', 'branch', 'tag']);

  if (cmd.commit) {
    sentenza = sentenza.on({ commit: cmd.commit.toString() });
  }
  if (cmd.branch) {
    sentenza = sentenza.on({ branch: cmd.branch.toString() });
  }
  if (cmd.tag) {
    sentenza = sentenza.on({ tag: cmd.tag.toString() });
  }

  let pipeline: Promise<SentenzaBitbucketPipeline>;
  if (trigger.startsWith('branch:')) {
    pipeline = sentenza.trigger(trigger.substr(7));
  } else if (trigger.startsWith('custom:')) {
    const variables: { [key: string]: string } = {};
    Object.keys(process.env)
      .filter((key) => key.startsWith('SENTENZA_'))
      .forEach((key) => {
        variables[key.substr(9)] = process.env[key];
      });
    pipeline = sentenza.trigger({ custom: trigger.substr(7), variables });
  } else {
    console.error(
      'Invalid pipeline name. Use the following syntax: branch:<your-branch> or custom:<your-custom-pipeline>',
    );
    process.exit(1);
  }
  return { sentenza, pipeline };
};

program
  .command('trigger', 'Trigger a pipeline without waiting for the pipeline to finish.')
  .argument(
    '<pipeline>',
    'Expected argument is the name of the pipeline to run, prefixed by custom: (for custom pipelines) or branch: (for branch pipelines). For custom pipeline you can set variables by setting them with SENTENZA_ prefix (e.g. SENTENZA_FOO=bar will set FOO=bar in custom pipeline)',
  )
  .option(
    '-r --repository <repository>',
    'Specify target repository full name (i.e. username and repository name separated by a slash, like ClintEastwood/WesternProjectRepository)',
    { required: true },
  )
  .option(
    '-a, --auth <user>:<app_password>',
    'Authentication details, username and password separated by ":" (e.g. SergioLeone:$MY_SECRET_PASS_FROM_ENV). Note: You cannot have ":" in your app password. If it is the case, please re-generate it. ',
  )
  .option(
    '-c, --commit <hash>',
    'The full hash (short form not supported) of the target commit. This option cannot be used with -b nor -t.',
  )
  .option('-b, --branch <name>', 'The name of the target branch. This option cannot be used with -b nor -t.')
  .option('-t, --tag <name>', 'The name of the target tag. This option cannot be used with -b nor -t.')
  .action(async ({ args, options }) => {
    const trigger = args.pipeline.toString();
    const { sentenza, pipeline } = triggerPipeline(trigger, options);
    const spinner = ora(`Trigger pipeline ${trigger} on ${JSON.stringify(sentenza.target)}`).start();
    try {
      const result = await pipeline;
      spinner.succeed(`Pipeline ${trigger} triggered on ${JSON.stringify(sentenza.target)}`);
      console.info(
        `See pipeline execution @  https://bitbucket.org/${result.details.repository.full_name}/addon/pipelines/home#!/results/${result.details.uuid}`,
      );
      process.exit(0);
    } catch (e) {
      spinner.fail();
      printError(e);
      process.exit(1);
    }
  });

const triggerAndReturnWatcher = async (trigger: string, cmd: ParsedOptions): Promise<SentenzaBitbucketPipeline> => {
  const { sentenza, pipeline } = triggerPipeline(trigger, cmd);
  const spinner = ora(`Trigger pipeline ${trigger} on ${JSON.stringify(sentenza.target)}`).start();
  let runner: SentenzaBitbucketPipeline;
  try {
    runner = await pipeline;
    spinner.succeed(`Pipeline ${trigger} triggered on ${JSON.stringify(sentenza.target)}`);
  } catch (e) {
    spinner.fail();
    printError(e);
    process.exit(1);
  }
  console.info(
    `See pipeline execution @  https://bitbucket.org/${runner.details.repository.full_name}/addon/pipelines/home#!/results/${runner.details.uuid}`,
  );
  return runner;
};

program
  .command('watch', 'Trigger a pipeline and wait for the pipeline to finish. Exit 0 whatever the pipeline status.')
  .argument(
    '<pipeline>',
    'Expected argument is the name of the pipeline to run, prefixed by custom: (for custom pipelines) or branch: (for branch pipelines). For custom pipeline you can set variables by setting them with SENTENZA_ prefix (e.g. SENTENZA_FOO=bar will set FOO=bar in custom pipeline)',
  )
  .option(
    '-r --repository <repository>',
    'Specify target repository full name (i.e. username and repository name separated by a slash, like ClintEastwood/WesternProjectRepository)',
    { required: true, validator: CaporalValidator.STRING },
  )
  .option(
    '-a, --auth <user>:<app_password>',
    'Authentication details, username and password separated by ":" (e.g. SergioLeone:$MY_SECRET_PASS_FROM_ENV). Note: You cannot have ":" in your app password. If it is the case, please re-generate it. ',
  )
  .option(
    '-c, --commit <hash>',
    'The full hash (short form not supported) of the target commit. This option cannot be used with -b nor -t.',
  )
  .option('-b, --branch <name>', 'The name of the target branch. This option cannot be used with -b nor -t.')
  .option('-t, --tag <name>', 'The name of the target tag. This option cannot be used with -b nor -t.')
  .option('--polling-rate <seconds>', 'Polling rate (in seconds) to watch result. Default to ten seconds.', {
    validator: CaporalValidator.NUMBER,
  })
  .action(async ({ args, options }) => {
    try {
      const trigger = args.pipeline.toString();
      const pollingRate = Number(args.pollingRate);
      const runner = await triggerAndReturnWatcher(trigger, options);
      const spinner = ora('Pipeline is running').start();
      const result = await runner.finished(pollingRate);
      spinner.text = 'Pipeline has finished with status ' + result.state.name.toLowerCase();
      spinner.stop();
      process.exit(0);
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command(
    'expect-success',
    'Trigger a pipeline and wait for the pipeline to finish. Exit 0 if pipeline succeed, 1 otherwise',
  )
  .argument(
    '<pipeline>',
    'Expected argument is the name of the pipeline to run, prefixed by custom: (for custom pipelines) or branch: (for branch pipelines). For custom pipeline you can set variables by setting them with SENTENZA_ prefix (e.g. SENTENZA_FOO=bar will set FOO=bar in custom pipeline)',
  )
  .option(
    '-r --repository <repository>',
    'Specify target repository full name (i.e. username and repository name separated by a slash, like ClintEastwood/WesternProjectRepository)',
    { required: true },
  )
  .option(
    '-a, --auth <user>:<app_password>',
    'Authentication details, username and password separated by ":" (e.g. SergioLeone:$MY_SECRET_PASS_FROM_ENV). Note: You cannot have ":" in your app password. If it is the case, please re-generate it. ',
  )
  .option(
    '-c, --commit <hash>',
    'The full hash (short form not supported) of the target commit. This option cannot be used with -b nor -t.',
  )
  .option('-b, --branch <name>', 'The name of the target branch. This option cannot be used with -b nor -t.')
  .option('-t, --tag <name>', 'The name of the target tag. This option cannot be used with -b nor -t.')
  .option('--polling-rate <seconds>', 'Polling rate (in seconds) to watch result. Default to ten seconds.', {
    validator: CaporalValidator.NUMBER,
  })
  .action(async ({ args, options }) => {
    let runner: SentenzaBitbucketPipeline;
    const trigger = args.pipeline.toString();
    const pollingRate = Number(args.pollingRate);
    try {
      runner = await triggerAndReturnWatcher(trigger, options);
    } catch (e) {
      printError(e);
      process.exit(1);
    }
    const spinner = ora('Pipeline is running').start();
    try {
      await runner.succeeded(pollingRate);
      spinner.succeed('Pipeline has succeeded 🎉');
      process.exit(0);
    } catch (e: unknown) {
      const isPipelineCompleted = (e: unknown): e is IPipelineDetails => {
        return (e as IPipelineDetails).state !== undefined;
      };
      if (isPipelineCompleted(e)) {
        switch (e.state?.result?.name) {
          case 'FAILED':
            spinner.fail(chalk.red('Pipeline has failed 💥'));
            break;
          case 'STOPPED':
            spinner.fail(chalk.yellow('Pipeline has been stopped 🚦'));
            break;
          default:
            spinner.fail(chalk.red('Pipeline has not succeeded 😞'));
            break;
        }
      } else {
        printError(e as Error);
      }
      process.exit(1);
    }
  });

(async () => await program.run())();
