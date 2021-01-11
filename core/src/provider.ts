import { SentenzaPipeline } from './pipeline';
import { logger } from './logger';

export type EnvVars = { [key: string]: string | number | boolean };
export type SecuredEnvVars = Array<{ key: string; value: string | number | boolean; secured?: boolean }>;

export type CustomPipelineVariables = EnvVars | SecuredEnvVars;

export const isSecuredEnvVars = (options: CustomPipelineVariables): options is SecuredEnvVars => Array.isArray(options);

export type BranchOptions = { branch: string };
export type CommitOptions = { commit: string };
export type TagOptions = { tag: string };
export type CustomTriggerOptions = { custom: string; variables?: CustomPipelineVariables };

export type TriggerOptions = BranchOptions | CustomTriggerOptions;
export type TargetOptions = BranchOptions | CommitOptions | TagOptions;

export const isBranchOptions = (options: TriggerOptions | TargetOptions): options is BranchOptions =>
  (options as BranchOptions).branch !== undefined;

export const isCommitOptions = (options: TargetOptions): options is CommitOptions =>
  (options as CommitOptions).commit !== undefined;

export abstract class SentenzaProvider {
  protected _target: TargetOptions;
  protected _trigger: TriggerOptions;
  protected _repository: string;

  get options(): {
    trigger: BranchOptions | CustomTriggerOptions;
    repository: string;
    target: BranchOptions | CommitOptions | TagOptions;
  } {
    return {
      repository: this._repository,
      target: this._target,
      trigger: this._trigger,
    };
  }

  repository(url: string): SentenzaProvider {
    this._repository = url;
    return this;
  }

  get target(): TargetOptions {
    return this._target;
  }

  abstract auth(...args: never[]): SentenzaProvider;

  on(target: string | TargetOptions): SentenzaProvider {
    if (typeof target === 'string') {
      logger('target', 'received string', target);
      this._target = { branch: target };
    } else {
      logger('target', 'received target', target);
      this._target = target;
    }
    return this;
  }

  async trigger(pipeline: string | TriggerOptions): Promise<SentenzaPipeline> {
    if (typeof pipeline === 'string') {
      logger('trigger', 'received string', pipeline);
      this._trigger = { branch: pipeline };
    } else {
      logger('trigger', 'received pipeline', pipeline);
      this._trigger = pipeline;
    }
    const isBranchPipeline = Object.prototype.hasOwnProperty.call(this._trigger, 'branch');
    logger('trigger', { isBranchPipeline });
    if (!this._target && isBranchPipeline) {
      logger('trigger', 'trigger("branch") called without target specified, running on same branch');
      this._target = this._trigger as { branch: string };
    }
    if (!this._target) {
      logger('trigger', 'no target specified');
      throw new Error('No target defined to run pipeline. Please specify a target branch, commit hash or target tag.');
    }

    logger(
      'trigger',
      'common processing done, provider must now call API to trigger pipeline and return a SentenzaPipeline subclass',
    );
    return null;
  }
}
