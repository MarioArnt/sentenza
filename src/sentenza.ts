import { SentenzaProvider } from './provider';

export class Sentenza {
  static provider<T extends SentenzaProvider>(provider: string): T {
    let module: { default: SentenzaProvider };
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      module = require(`sentenza-${provider}`);
    } catch (e) {
      throw new Error(
        `No provider found for ${provider}. Make sure package sentenza-${provider} is installed on your current NPM project`,
      );
    }
    if (!module.default) {
      throw new Error(`Package sentenza-${provider} has no default export`);
    }
    const hasOn = module.default.on && typeof module.default.on === 'function';
    const hasTrigger = module.default.trigger && typeof module.default.trigger === 'function';
    if (hasOn && hasTrigger) {
      return module.default as T;
    } else {
      throw new Error(`Provider sentenza-${provider} incorrectly extends Sentenza Plugin API`);
    }
  }
}
