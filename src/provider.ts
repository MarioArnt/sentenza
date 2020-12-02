import { SentenzaPipeline } from './pipeline';

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
      this._target = { branch: target };
    } else {
      this._target = target;
    }
    return this;
  }

  async trigger(pipeline: string | TriggerOptions): Promise<SentenzaPipeline> {
    if (typeof pipeline === 'string') {
      this._trigger = { branch: pipeline };
    } else {
      this._trigger = pipeline;
    }
    const isBranchPipeline = Object.prototype.hasOwnProperty.call(this._trigger, 'branch');

    if (!this._target && isBranchPipeline) {
      this._target = this._trigger as { branch: string };
    }

    if (!this._target) {
      throw new Error('No target defined to run pipeline. Please specify a target branch, commit hash or target tag.');
    }

    return null;
  }
}
