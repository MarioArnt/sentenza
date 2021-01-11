import { printVersion } from '../src';
import { readJsonSync } from 'fs-extra';
import { join } from 'path';

describe('[helper] printVersion', () => {
  it('should print correct version', () => {
    const version = printVersion();
    const pkgVersion = readJsonSync(join(__dirname, '..', 'package.json')).version;
    expect(version.match(new RegExp('Sentenza ' + pkgVersion))).toBeTruthy();
  });
  it('should print correct version fo provider', () => {
    const version = printVersion({ name: 'FakeProvider', version: '1.0.0-alpha' });
    expect(version.includes('FakeProvider 1.0.0-alpha')).toBeTruthy();
  });
});
