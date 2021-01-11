import {
  SentenzaProvider,
  TriggerOptions,
  isSecuredEnvVars,
  isBranchOptions,
  isCommitOptions,
  TargetOptions,
} from '../src';

class FakeProvider extends SentenzaProvider {
  auth(_foo: string) {
    return this;
  }
}

describe('[helper] isBranchOptions', () => {
  it('should work', () => {
    expect(isBranchOptions({ branch: 'dev' })).toBeTruthy();
    expect(isBranchOptions((42 as unknown) as TriggerOptions)).toBeFalsy();
  });
});

describe('[helper] isCommitOptions', () => {
  it('should work', () => {
    expect(isCommitOptions({ commit: 'dev' })).toBeTruthy();
    expect(isCommitOptions((42 as unknown) as TargetOptions)).toBeFalsy();
  });
});

describe('[helper] isSecuredEnvVars', () => {
  it('should work', () => {
    expect(isSecuredEnvVars({ foo: 'bar' })).toBeFalsy();
    expect(isSecuredEnvVars([{ key: 'foo', value: 'bar', secured: true }])).toBeTruthy();
  });
});

describe('[class] SentenzaProvider', () => {
  describe('[method] repository', () => {
    it('should set repository', () => {
      const fakeProvider = new FakeProvider();
      fakeProvider.repository('foo');
      expect(fakeProvider.options.repository).toBe('foo');
    });
  });
  describe('[method] on', () => {
    it('should set branch target when a string is received', () => {
      const fakeProvider = new FakeProvider();
      fakeProvider.on('foo');
      expect(fakeProvider.target).toEqual({ branch: 'foo' });
    });
    it('should set commit or tag target', () => {
      const fakeProvider = new FakeProvider();
      fakeProvider.on({ commit: 'abcdef' });
      expect(fakeProvider.target).toEqual({ commit: 'abcdef' });
    });
  });
  describe('[method] trigger', () => {
    it('should set branch trigger when a string is received', () => {
      const fakeProvider = new FakeProvider();
      fakeProvider.trigger('foo');
      expect(fakeProvider.options.trigger).toEqual({ branch: 'foo' });
    });
    it('should throw if a custom pipeline is requested without target', async () => {
      const fakeProvider = new FakeProvider();
      try {
        await fakeProvider.trigger({ custom: 'foo' });
        fail();
      } catch (e) {
        expect(e.message).toBe(
          'No target defined to run pipeline. Please specify a target branch, commit hash or target tag.',
        );
      }
    });
    it('should set custom pipeline as requested', () => {
      const fakeProvider = new FakeProvider();
      fakeProvider.on('dev').trigger({
        custom: 'foo',
        variables: {
          bar: 'baz',
        },
      });
      expect(fakeProvider.options.trigger).toEqual({
        custom: 'foo',
        variables: {
          bar: 'baz',
        },
      });
    });
  });
});
