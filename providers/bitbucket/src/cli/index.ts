#!/usr/bin/env node

/* eslint-disable no-console */
import { Command } from 'commander';
import { Sentenza, printVersion } from 'sentenza';
import { SentenzaBitbucket, SentenzaBitbucketPipeline } from '..';
import ora from 'ora';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { HTTPError } from 'got';
import { IPipelineDetails } from '../bitbucket-api';

const version = () => JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json')).toString()).version;

const program = new Command();
program.version(printVersion({ name: 'Bitbucket provider', version: version() }));

const conflictingOptions = (cmd: { [key: string]: string }, options: string[]) => {
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
  cmd: { [key: string]: string },
): { pipeline: Promise<SentenzaBitbucketPipeline>; sentenza: SentenzaBitbucket } => {
  let sentenza = Sentenza.provider<SentenzaBitbucket>('bitbucket');
  if (cmd.auth) {
    const credentials = cmd.auth.split(':');
    sentenza = sentenza.auth({
      username: credentials[0],
      app_password: credentials[1],
    });
  }
  sentenza = sentenza.repository(cmd.repository);

  conflictingOptions(cmd, ['commit', 'branch', 'tag']);

  if (cmd.commit) {
    sentenza = sentenza.on({ commit: cmd.commit });
  }
  if (cmd.branch) {
    sentenza = sentenza.on({ branch: cmd.branch });
  }
  if (cmd.tag) {
    sentenza = sentenza.on({ tag: cmd.tag });
  }

  let pipeline: Promise<SentenzaBitbucketPipeline>;
  if (trigger.startsWith('branch:')) {
    pipeline = sentenza.trigger(trigger.substr(7));
  } else if (trigger.startsWith('custom:')) {
    const variables: { [key: string]: string } = {};
    Object.keys(process.env)
      .filter((key) => key.startsWith('SENTENZA_'))
      .forEach((key) => {
        variables[key] = process.env[key];
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
  .command('trigger <custom:pipeline|branch:pipeline>')
  .requiredOption('-r --repository <repository>', 'Target repository')
  .option('-a, --auth <user>:<app_password>', 'Username')
  .option('-c, --commit <hash>', 'CI provider')
  .option('-b, --branch <name>', 'CI provider')
  .option('-t, --tag <name>', 'CI provider')
  .action(async (trigger, cmd) => {
    const { sentenza, pipeline } = triggerPipeline(trigger, cmd);
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

const triggerAndReturnWatcher = async (
  trigger: string,
  cmd: { [key: string]: string },
): Promise<SentenzaBitbucketPipeline> => {
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
  .command('watch <custom:pipeline|branch:pipeline>')
  .requiredOption('-r --repository <repository>', 'Target repository')
  .option('-a, --auth <user>:<app_password>', 'Username')
  .option('-c, --commit <hash>', 'CI provider')
  .option('-b, --branch <name>', 'CI provider')
  .option('-t, --tag <name>', 'CI provider')
  .option('--polling-rate <seconds>', 'CI provider')
  .action(async (trigger, cmd) => {
    try {
      const runner = await triggerAndReturnWatcher(trigger, cmd);
      const spinner = ora('Pipeline is running').start();
      const result = await runner.finished(cmd.pollingRate);
      spinner.text = 'Pipeline has finished with status ' + result.state.name.toLowerCase();
      spinner.stop();
      process.exit(0);
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command('expect-success <custom:pipeline|branch:pipeline>')
  .requiredOption('-r --repository <repository>', 'Target repository')
  .option('-a, --auth <user>:<app_password>', 'Username')
  .option('-c, --commit <hash>', 'CI provider')
  .option('-b, --branch <name>', 'CI provider')
  .option('-t, --tag <name>', 'CI provider')
  .option('--polling-rate <seconds>', 'CI provider')
  .action(async (trigger, cmd) => {
    let runner: SentenzaBitbucketPipeline;
    try {
      runner = await triggerAndReturnWatcher(trigger, cmd);
    } catch (e) {
      printError(e);
      process.exit(1);
    }
    const spinner = ora('Pipeline is running').start();
    try {
      await runner.succeeded(cmd.pollingRate);
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

(async () => program.parseAsync(process.argv))();
