import { Sentenza } from '../src';
import { join } from 'path';
import { existsSync, mkdirSync, writeJsonSync } from 'fs-extra';
// @ts-ignore
import * as test from 'sentenza-no-trigger'

describe('[class] Sentenza', () => {
  console.log(test);
  const fakeProviders = ['no-default', 'no-trigger', 'no-on', 'valid'];
  const moduleRoot = join(__dirname, '..', 'node_modules');
  beforeAll(() => {
    for (const provider of fakeProviders) {
      const packageName = 'sentenza-' + provider;
      if (!existsSync(join(moduleRoot, packageName))) {
        mkdirSync(join(moduleRoot, packageName));
      }
      writeJsonSync(join(moduleRoot, packageName, 'package.json'), { name: packageName, version: '0.0.1' });
    };
  });
  afterAll(() => {

  });
  describe('[static method] provider', () => {
    it('should throw if provider does not exists', () => {
      try {
        Sentenza.provider('not-existing');
        fail();
      } catch (e) {
        expect(e.message).toBe(
          'No provider found for not-existing. Make sure package sentenza-not-existing is installed on your current NPM project',
        );
      }
    });
    it('should throw if module has ho default export', () => {
      jest.mock('sentenza-no-default', () => ({
        foo: 'bar',
      }));
      try {
        Sentenza.provider('no-default');
        fail();
      } catch (e) {
        expect(e.message).toBe('');
      }
    });
    it('should throw if module default export incorrectly extends SentenzaProvider', () => {
      jest.mock('sentenza-no-trigger', () => ({
        on: () => 'stubbed',
      }));
      try {
        Sentenza.provider('no-trigger');
        fail();
      } catch (e) {
        expect(e.message).toBe('');
      }
      jest.mock('sentenza-no-on', () => ({
        trigger: () => 'stubbed',
      }));
      try {
        Sentenza.provider('no-on');
        fail();
      } catch (e) {
        expect(e.message).toBe('');
      }
    });
    it('should return a SentenzaProvider instance otherwise', () => {
      jest.mock('sentenza-bitbucket', () => ({
        on: () => 'stubbed',
        trigger: () => 'stubbed',
      }));
      const sentenza = Sentenza.provider('bitbucket');
      expect(sentenza.on).toBeDefined();
      expect(sentenza.trigger).toBeDefined();
    });
  });
});
