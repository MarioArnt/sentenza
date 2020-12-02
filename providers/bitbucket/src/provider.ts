import { SentenzaProvider, TargetOptions, TriggerOptions } from 'sentenza';
import { BitbucketAPI } from './bitbucket-api';
import { SentenzaBitbucketPipeline } from './pipeline';

interface IBitbucketCredentials {
  username: string;
  app_password: string;
}

export class SentenzaBitbucket extends SentenzaProvider {
  private _auth: IBitbucketCredentials;

  on(target: TargetOptions): SentenzaBitbucket {
    super.on(target);
    return this;
  }

  auth(credentials: IBitbucketCredentials): SentenzaBitbucket {
    this._auth = credentials;
    return this;
  }

  repository(url: string): SentenzaBitbucket {
    const fullUrlParser = /^https?:\/\/bitbucket\.org\/(.+)$/;
    let repository = url.match(fullUrlParser) ? url.match(fullUrlParser)[1] : url;
    repository = repository.endsWith('/') ? repository.substr(0, repository.length - 1) : repository;
    const segments = repository.split('/');
    if (segments.length !== 2) {
      throw new Error(
        'Invalid repository: please make sure you are passing either the full bitbucket URL (e.g. https://bitbucket.org/SergioLeone/western-project/) or the short form $username/$repository (e.g. SergioLeone/western-project)',
      );
    }
    this._repository = repository;
    return this;
  }

  async trigger(pipeline: string | TriggerOptions): Promise<SentenzaBitbucketPipeline> {
    await super.trigger(pipeline);
    if (!this._auth) {
      throw new Error('Invalid credentials');
    }
    if (!this._auth.username) {
      throw new Error('Invalid credentials: missing username');
    }
    if (!this._auth.app_password) {
      throw new Error('Invalid credentials: missing app password');
    }
    const api = new BitbucketAPI(this._auth.username, this._auth.app_password);
    const response = await api.triggerPipeline(this._repository, { trigger: this._trigger, target: this._target });
    return new SentenzaBitbucketPipeline(api, response);
  }
}
