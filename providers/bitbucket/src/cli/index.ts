#!/usr/bin/env node

/* eslint-disable no-console */
import { Command } from 'commander';
import { Sentenza } from 'sentenza';
import { SentenzaBitbucket, SentenzaBitbucketPipeline } from '..';
import ora from 'ora';

const VERSION = '1.0.0-beta1';

const program = new Command();
program.version(`
            (_/-------------_____________________________________________)
          \\\`|  /~~~~~~~~~~\\                                              |       Sentenza ${VERSION}
           ;  |--------(-||______________________________________________|
           ;  |--------(-| ____________|
           ;  \\__________/'
         _/__         ___;
      ,~~    |  __----~~
     '        ~~|    (  |
    '      '~~  \\\`____'
   '      '
  '      \\\`
 '       \\\`
'--------\\\`
  `);

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
    pipeline = sentenza.trigger({ custom: trigger.substr(7) });
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
      await pipeline;
      spinner.succeed(`Pipeline ${trigger} triggered on ${JSON.stringify(sentenza.target)}`);
      process.exit(0);
    } catch (e) {
      spinner.fail();
      console.error(e);
      process.exit(1);
    }
  });

(async () => program.parseAsync(process.argv))();
