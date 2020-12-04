# Sentenza provider for Bitbucket

## Command Line Interface

Install sentenza and bitbucket provider in your project

``npm i -D sentenza sentenza-bitbucket``

Check installation using:

``npx sentenza -p bitbucket --version``

Commands documentation are available by running ``npx sentenza -p bitbucket --help``

### Trigger a pipeline

`npx sentenza -p bitbucket trigger <custom:pipeline|branch:pipeline>`

Trigger a pipeline without waiting for the pipeline to finish. 

Expected argument is the name of the pipeline to run, prefixed by custom: (for custom pipelines) or branch: (for branch pipelines). 
                                                    
For a custom pipeline you can set variables by setting them with SENTENZA_ prefix (e.g. SENTENZA_FOO=bar will set FOO=bar in a custom pipeline)

Options:

```bash
  # required
  -r --repository <repository>                      Specify target repository full name (i.e. username and repository name separated by a slash, like ClintEastwood/WesternProjectRepository)
  
  # optional
  -c, --commit <hash>                               The full hash (short form not supported) of the target commit. This option cannot be used with -b nor -t.
  -b, --branch <name>                               The name of the target branch. This option cannot be used with -b nor -t.
  -t, --tag <name>                                  The name of the target tag. This option cannot be used with -b nor -t.
  -a, --auth <user>:<app_password>                  Authentication details, username and password separated by ":" (e.g. SergioLeone:$MY_SECRET_PASS_FROM_ENV). Note: You cannot have ":" in your app
                                                    password. If it is the case, please re-generate it.
```


### Trigger a pipeline and wait for it to finish

`npx sentenza -p bitbucket watch <custom:pipeline|branch:pipeline>`

Trigger a pipeline and wait for the pipeline to finish.

Exit 0 whatever the pipeline status.

Expected argument is the name of the pipeline to run, prefixed by custom: (for custom pipelines) or branch: (for branch pipelines). 
                                                    
For a custom pipeline you can set variables by setting them with SENTENZA_ prefix (e.g. SENTENZA_FOO=bar will set FOO=bar in a custom pipeline)

Options:

```bash
  # required
  -r --repository <repository>                      Specify target repository full name (i.e. username and repository name separated by a slash, like ClintEastwood/WesternProjectRepository)
  
  # optional
  -c, --commit <hash>                               The full hash (short form not supported) of the target commit. This option cannot be used with -b nor -t.
  -b, --branch <name>                               The name of the target branch. This option cannot be used with -b nor -t.
  -t, --tag <name>                                  The name of the target tag. This option cannot be used with -b nor -t.
  -a, --auth <user>:<app_password>                  Authentication details, username and password separated by ":" (e.g. SergioLeone:$MY_SECRET_PASS_FROM_ENV). Note: You cannot have ":" in your app
                                                    password. If it is the case, please re-generate it.
  --polling-rate <seconds>                          Polling rate (in seconds) to watch result. Default to ten seconds.
```

### Trigger a pipeline and wait for it to succeed

`npx sentenza -p bitbucket expect-succes <custom:pipeline|branch:pipeline>`

Trigger a pipeline and wait for the pipeline to finish.

Exit 0 if pipeline succeed, 1 otherwise.

Expected argument is the name of the pipeline to run, prefixed by custom: (for custom pipelines) or branch: (for branch pipelines). 
                                                    
For a custom pipeline you can set variables by setting them with SENTENZA_ prefix (e.g. SENTENZA_FOO=bar will set FOO=bar in a custom pipeline)

Options:

```bash
  # required
  -r --repository <repository>                      Specify target repository full name (i.e. username and repository name separated by a slash, like ClintEastwood/WesternProjectRepository)
  
  # optional
  -c, --commit <hash>                               The full hash (short form not supported) of the target commit. This option cannot be used with -b nor -t.
  -b, --branch <name>                               The name of the target branch. This option cannot be used with -b nor -t.
  -t, --tag <name>                                  The name of the target tag. This option cannot be used with -b nor -t.
  -a, --auth <user>:<app_password>                  Authentication details, username and password separated by ":" (e.g. SergioLeone:$MY_SECRET_PASS_FROM_ENV). Note: You cannot have ":" in your app
                                                    password. If it is the case, please re-generate it.
  --polling-rate <seconds>                          Polling rate (in seconds) to watch result. Default to ten seconds.
```

#### Using specific version for providers

Sentenza CLI uses ``npx`` under the hood to call provider's CLI. So you can use any version of the provider this way:

``npx sentenza -p bitbucket@1.0.0 --help``

## Programmatic use

`````typescript

import { Sentenza } from 'sentenza';
import { SentenzaBitbucket } from 'sentenza-awesome-ci';

// create an instance of your provider
const runner = Sentenza.provider<SentenzaBitbucket>('bitbucket');

// trigger pipeline branch:dev on branche dev
 await runner
  .auth({ username: 'JohnWayne', app_password: process.env.APP_PASSWORD })
  .repository('foo/bar')
  .trigger('dev');

// trigger pipeline branch:dev on branche staging
 await runner
  .on('staging')
  .trigger('dev');

// trigger pipeline branch:dev on specific commit
 await runner
  .on({ commit: '62ae9cbf183ea36c363e296d7df544b97eaa979c' }) // /!\ short form is 62ae9cb not supported  
  .trigger('dev');

// trigger pipeline branch:dev on specific tag
 await runner
  .on({ tag: '1.0.2' })
  .trigger({ branch: 'master' });

// trigger custom pipeline on branch dev
 await runner
  .on('dev') // /!\ short form is 62ae9cb not supported  
  .trigger({ custom: 'sonar-analysis', variables: { PROJECT_ID: process.env.SONAR_PROJECT_ID } });

// trigger pipeline branch:dev on branche dev and wait for success
const pipeline = await runner.trigger('dev');
try {
  console.info('Pipeline has succeed \\o/');
} catch (e) {
  console.error('Pipeline has failed :S', e.state);
}
`````
