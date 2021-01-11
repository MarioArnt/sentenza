import { Sentenza } from '../src';
import { join } from 'path';
import { existsSync, writeFileSync, mkdirSync, removeSync, writeJsonSync } from 'fs-extra';

const fakeProviders = ['no-default', 'no-trigger', 'no-on', 'valid', 'esm'];

const mocks: { [key: string]: string } = {
  'esm': `export default class FakeProvider { on() {} trigger(){} }`,
  'no-default': `exports.foo = 42`,
  'no-trigger': `class FakeProvider { on() {} }; exports.default = FakeProvider;`,
  'no-on': `class FakeProvider { trigger() {} }; exports.default = FakeProvider;`,
};

describe('[class] Sentenza', () => {
  const moduleRoot = join(__dirname, '..', 'node_modules');
  beforeAll(() => {
    for (const provider of fakeProviders) {
      const packageName = 'sentenza-' + provider;
      if (!existsSync(join(moduleRoot, packageName))) {
        mkdirSync(join(moduleRoot, packageName));
      }
      writeJsonSync(join(moduleRoot, packageName, 'package.json'), {
        name: packageName,
        version: '0.0.1',
        main: 'index.js',
      });
      writeFileSync(join(moduleRoot, packageName, 'index.js'), mocks[provider]);
    }
  });
  afterAll(() => {
    for (const provider of fakeProviders) {
      const packageName = 'sentenza-' + provider;
      if (existsSync(join(moduleRoot, packageName))) {
        removeSync(join(moduleRoot, packageName));
      }
    }
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
    it('should throw if module use ESM syntax instead CommonJS', () => {
      try {
        Sentenza.provider('esm');
        fail();
      } catch (e) {
        expect(e.message).toBe(
          'Failed to import sentenza-esm. Make sure you are using CommonJS syntax and you are exporting a valid provider',
        );
      }
    });
    it('should throw if module has ho default export', () => {
      try {
        Sentenza.provider('no-default');
        fail();
      } catch (e) {
        expect(e.message).toBe('Package sentenza-no-default has no default export');
      }
    });
    it('should throw if module default export incorrectly extends SentenzaProvider', () => {
      try {
        Sentenza.provider('no-trigger');
        fail();
      } catch (e) {
        expect(e.message).toBe('Provider sentenza-no-trigger incorrectly extends Sentenza Plugin API');
      }
      try {
        Sentenza.provider('no-on');
        fail();
      } catch (e) {
        expect(e.message).toBe('Provider sentenza-no-on incorrectly extends Sentenza Plugin API');
      }
    });
    it('should return a SentenzaProvider instance otherwise', () => {
      const sentenza = Sentenza.provider('bitbucket');
      expect(sentenza.on).toBeDefined();
      expect(sentenza.trigger).toBeDefined();
    });
  });
});
