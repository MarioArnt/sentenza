import { SentenzaPipeline } from 'sentenza';
import { BitbucketAPI, IPipelineDetails } from './bitbucket-api';
import { logger } from './logger';

export class SentenzaBitbucketPipeline extends SentenzaPipeline {
  private readonly _details: IPipelineDetails;
  private readonly _api: BitbucketAPI;

  constructor(api: BitbucketAPI, details: IPipelineDetails) {
    super();
    this._details = details;
    this._api = api;
  }

  get details(): IPipelineDetails {
    return this._details;
  }

  private async _watch(pollingRate: number, expectedState?: string): Promise<IPipelineDetails> {
    logger('Watching pipeline progress', { pollingRate, expectedState });
    return new Promise<IPipelineDetails>((resolve, reject) => {
      const polling = setInterval(async () => {
        const repository = this._details.repository.full_name;
        const uuid = this._details.uuid;
        const status = await this._api.getPipelineStatus(repository, uuid);
        if (!['PENDING', 'IN_PROGRESS'].includes(status.state.name)) {
          logger('Pipeline has finished with status', status.state);
          clearInterval(polling);
          if (expectedState && expectedState !== status.state.result?.name) {
            logger('Received state and expected state mismatch, rejecting', {
              received: status.state.name,
              expected: expectedState,
            });
            return reject(status);
          }
          return resolve(status);
        } else {
          logger('Pipeline is not finished');
        }
      }, pollingRate * 1000);
    });
  }

  async finished(pollingRate = 10): Promise<IPipelineDetails> {
    return this._watch(pollingRate);
  }

  async succeeded(pollingRate = 10): Promise<IPipelineDetails> {
    return this._watch(pollingRate, 'SUCCESSFUL');
  }
}

/**
          (_/-------------_____________________________________________)
          `|  /~~~~~~~~~~\                   SENTENZA                  |
           ;  |--------(-||____________________________________________|
           ;  |--------(-| ____________|
           ;  \__________/'
         _/__         ___;
      ,~~    |  __--~~
     '        ~~| (  |
    '      '~~  `____'
   '      '
  '      `
 '       `
'--------`
 **/
