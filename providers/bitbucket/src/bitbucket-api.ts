import got, { Got } from 'got';
import {
  isSecuredEnvVars,
  SecuredEnvVars,
  CustomTriggerOptions,
  isBranchOptions,
  isCommitOptions,
  TargetOptions,
  TriggerOptions,
  EnvVars,
} from 'sentenza';
import { logger } from './logger';

interface IPipelineOptions {
  target: TargetOptions;
  trigger: TriggerOptions;
}

interface IBitbucketPayload {
  target: {
    type: 'pipeline_commit_target' | 'pipeline_ref_target';
    ref_type?: 'branch' | 'named_branch' | 'bookmark' | 'tag';
    ref_name?: string;
    commit?: {
      hash: string;
      type: 'commit';
    };
    selector?: {
      type: 'custom' | 'branches';
      pattern: string;
    };
  };
  variables?: SecuredEnvVars;
}

export interface IPipelineDetails {
  type: string;
  uuid: string;
  repository: {
    name: string;
    type: string;
    full_name: string;
    links: {
      self: { href: string };
      html: { href: string };
      avatar: { href: string };
    };
    uuid: string;
  };
  state: {
    name: 'IN_PROGRESS' | 'PENDING' | 'COMPLETED';
    type: string;
    stage: {
      name: string;
      type: string;
    };
    result: {
      name: 'STOPPED' | 'SUCCESSFUL' | 'FAILED';
    };
  };
  build_number: number;
  creator: {
    display_name: string;
    uuid: string;
    links: {
      self: { href: string };
      html: { href: string };
      avatar: { href: string };
    };
    type: string;
    nickname: string;
    account_id: string;
  };
  created_on: Date;
  target: {
    type: string;
    ref_type: string;
    ref_name: string;
    selector: {
      type: string;
      pattern: string;
    };
    commit: {
      type: string;
      hash: string;
      links: {
        self: { href: string };
        html: { href: string };
      };
    };
  };
  trigger: {
    name: string;
    type: string;
  };
  run_number: number;
  duration_in_seconds: number;
  build_seconds_used: number;
  first_successful: boolean;
  expired: boolean;
  links: {
    self: { href: string };
    steps: { href: string };
  };
  has_variables: boolean;
}

interface ITagDetails {
  target: { hash: string };
}

export class BitbucketAPI {
  private _client: Got;

  constructor(username: string, app_password: string) {
    const credentials = Buffer.from(`${username}:${app_password}`).toString('base64');
    this._client = got.extend({
      prefixUrl: 'https://api.bitbucket.org/2.0',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getTagDetails(repository: string, tag: string): Promise<ITagDetails> {
    const url = `repositories/${repository}/refs/tags/${tag}`
    logger('GET', url);
    try {
      const response = await this._client.get(url).json<ITagDetails>();
      logger('GET', url, response);
      return response;
    } catch (e) {
      logger(e);
      throw e;
    }
  }

  async triggerPipeline(repository: string, options: IPipelineOptions): Promise<IPipelineDetails> {
    const payload = await this._payload(options, repository);
    const url = `repositories/${repository}/pipelines/`;
    logger('POST', url, payload);
    try {
      const response = await this._client
        .post(url, {
          json: payload,
        })
        .json<IPipelineDetails>();
      logger('POST', url, response);
      return response;
    } catch (e) {
      logger(e);
      throw e;
    }
  }

  async getPipelineStatus(repository: string, uuid: string): Promise<IPipelineDetails> {
    const url = `repositories/${repository}/pipelines/${uuid}`;
    logger('GET', url);
    try {
      const status = await this._client.get(url).json<IPipelineDetails>();
      logger('GET', url, status);
      return status;
    } catch (e) {
      logger(e);
      throw e;
    }
  }

  private async _payload(options: IPipelineOptions, repository: string): Promise<IBitbucketPayload> {
    const payload: IBitbucketPayload = {
      target: { type: isCommitOptions(options.target) ? 'pipeline_commit_target' : 'pipeline_ref_target' },
    };

    // Set target
    if (isCommitOptions(options.target)) {
      payload.target.commit = {
        hash: options.target.commit,
        type: 'commit' as const,
      };
    } else if (isBranchOptions(options.target)) {
      payload.target.ref_type = 'branch';
      payload.target.ref_name = options.target.branch;
    } else {
      const details = await this.getTagDetails(repository, options.target.tag);
      payload.target.ref_type = 'tag';
      payload.target.ref_name = options.target.tag;
      payload.target.commit = {
        hash: details.target.hash,
        type: 'commit' as const,
      };
    }

    // Set trigger
    if (isBranchOptions(options.trigger)) {
      payload.target.selector = {
        type: 'branches',
        pattern: options.trigger.branch,
      };
    } else {
      payload.target.selector = {
        type: 'custom',
        pattern: options.trigger.custom,
      };
      if (options.trigger.variables) {
        payload.variables = this._formatVariables(options.trigger);
      }
    }

    return payload;
  }

  private _formatVariables(options: CustomTriggerOptions): SecuredEnvVars {
    if (isSecuredEnvVars(options.variables)) {
      return options.variables;
    } else {
      const vars: EnvVars = options.variables;
      return Object.keys(vars).map((key: string) => ({
        key,
        value: vars[key],
      }));
    }
  }
}
