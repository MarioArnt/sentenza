#!/usr/bin/env node
/* eslint-disable no-console */
import { spawnSync } from 'child_process';

const hasFlagP = process.argv.includes('-p');
const hasFlagProvider = process.argv.includes('--provider');

const missingProvider = () => {
  console.error('Missing argument: Please specify a provider with -p or --provider option');
  process.exit(1);
};

const runForProvider = (flag: string) => {
  const idx = process.argv.indexOf(flag);
  const provider = process.argv[idx + 1];
  if (provider.startsWith('-')) {
    missingProvider();
  }
  spawnSync(
    'npx',
    [`sentenza-${provider}`, ...process.argv.slice(2).filter((arg) => arg !== flag && arg !== provider)],
    { stdio: 'inherit' },
  );
};

if (hasFlagP && hasFlagProvider) {
  console.error('Conflicting options: do not give both -p and --provider options');
  process.exit(1);
} else if (hasFlagP) {
  runForProvider('-p');
} else if (hasFlagProvider) {
  runForProvider('--provider');
} else {
  missingProvider();
}
