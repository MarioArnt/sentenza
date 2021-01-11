import { SentenzaProvider } from './provider';
import { logger } from './logger';

export class Sentenza {
  static provider<T extends SentenzaProvider>(provider: string): T {
    let module: { default: SentenzaProvider };
    logger('create sentenza instance using provider', provider);
    try {
      logger('importing provider', `sentenza-${provider}`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      module = require(`sentenza-${provider}`);
    } catch (e) {
      logger('provider not found', `sentenza-${provider}`);
      throw new Error(
        `No provider found for ${provider}. Make sure package sentenza-${provider} is installed on your current NPM project`,
      );
    }
    logger('provider found', module);
    console.log(module);
    if (!module.default) {
      throw new Error(`Package sentenza-${provider} has no default export`);
    }
    const hasOn = module.default.on && typeof module.default.on === 'function';
    const hasTrigger = module.default.trigger && typeof module.default.trigger === 'function';
    logger('validating provider', `sentenza-${provider}`, { hasOn, hasTrigger });
    if (hasOn && hasTrigger) {
      logger('provider valid', `sentenza-${provider}`);
      return module.default as T;
    } else {
      logger('provider invalid', `sentenza-${provider}`);
      throw new Error(`Provider sentenza-${provider} incorrectly extends Sentenza Plugin API`);
    }
  }
}
