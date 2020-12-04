# Implement your own sentenza provider

Great ! Developing sentenza providers is not that complicated.

In this guide, we will assume that you want to create a plugin for the fictional provider `Awesome CI`.

You just have to extend main `sentenza` package's abstract classes in a new NPM package called `sentenza-awesome-ci`

Feel free to check the `sentenza-bitbucket` [source code](https://github.com/MarioArnt/sentenza/blob/master/providers/bitbucket) and use mimicry.

## Step by step

### Create package

First create your package using `npm init`. Name it `sentenza-awesome-ci`.

### Extend `SentenzaProvider`

Create a class `SentenzaAwesomeCI` extending `SentenzaProvider`.

```typescript

// src/provider.ts

import { SentenzaProvider, TargetOptions, TriggerOptions } from 'sentenza';

export class SentenzaAwesomeCI extends SentenzaProvider {
  // Store infos to authenticate end user
  private _auth: ICredentials;

  on(target: TargetOptions): SentenzaBitbucket {
    // Logic handling method overload to define target is available in parent class
    super.on(target);
    // If you have somethinfg else to do, do it here :)
    // sentenza uses fluid syntax, return this so methods can be chained
    return this;
  }

  // Provide a method to give credentials
  auth(credentials: ICredentials): SentenzaBitbucket {
    this._auth = credentials;
    return this;
  }

  // Provide a method to repository credentials
  repository(url: string): SentenzaBitbucket {
    // Here you can parse argument and store validated form
    return this;
  }

  async trigger(pipeline: string | TriggerOptions): Promise<SentenzaBitbucketPipeline> {
    // Logic handling method overload to define pipeline to apply is available in parent class
    // You can reuse it 👍
    await super.trigger(pipeline);
    // Here you typically check that every information required to make API call to trigger pipeline has been given
    // ...
    // Then perform API call trigerring the pipeline to the CI provider
    // ...
    // Return an object representing the pipeline execution. See next section for more infos.
    return new SentenzaAwesomeCI();
  }
}
```

### Extend `SentenzaPipeline`

Your provider class `SentenzaProvider` must have a method trigger which returns a `SentenzaPipeline` sub-class.

Let's see this in details.

The base class is very concise and let you to proceed anyway you want.

````typescript
export abstract class SentenzaPipeline {
  abstract finished(): Promise<unknown>;
  abstract succeeded(): Promise<unknown>;
}

````

You just have to implement two methods: 

1. `finished` which wait for your pipeline to finish
2. `succeeded` which wait for your pipeline to finish and throw if it did not succeed.

You can return anything you want. Typically, pipeline execution summary.

To wait for your pipeline to finish you can use long polling as it is done in  `sentenza-bitbucket`.

### Exposing provider

Your NPM package must a `SentenzaProvider` provider instance as default export.

To do so, in the module entrypoint (generally `src/index.ts`), create an instance and export it:

`````typescript
import { SentenzaAwesomeCI } from './provider';

const provider = new SentenzaAwesomeCI();

// also export type definition
export * from './provider';

export default provider;
`````

Do not forget to declare your entry point and type definition root in `package.json`.

````json
{
  "name": "sentenza-awesome-ci",
  "version": "0.0.1",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "peerDependencies": {
    "sentenza": "^1.0.0" // you should declare sentenza as peer dependency
  }
}
````

Once your package published people will be able to use it by installing `npm i sentenza sentenza-awesome-ci`

In their project, they can use you provider this way:

`````typescript

import { Sentenza } from 'sentenza';
import { SentenzaAwesomeCi } from 'sentenza-awesome-ci';

// create an instance of your provider
const runner = Sentenza.provider<SentenzaAwesomeCi>('awesome-ci');

// use it
await runner.auth(/* credentials */).repository('foo/bar').trigger('master')

`````

### Exposing a CLI

You can also expose a provider for sentenza CLI.

To do so create your have to create own CLI program.

We strongly recommend to use [commander](https://github.com/tj/commander.js) or [yargs](https://github.com/yargs/yargs) to parse arguments `process.argv`.

Once your program implemented you must declare it `package.json` in the binary map.

````json
{
  "name": "sentenza-awesome-ci",
  "version": "0.0.1",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "bin": {
    "sentenza-awesome-cli": "lib/cli/index.js" // wherever your compiled CLI program is located
  },
  "peerDependencies": {
    "sentenza": "^1.0.0"
  }
}
````

> Note: your main CLI file must have the shebang #!/usr/bin/env node

Once published, sentenza CLI will use ``npx`` to call the matching provider CLI.

Invoking ``sentenza -p awesome-cli`` will call `npx sentenza-awesome-cli@latest`.

Main CLI will forward all subsequent arguments and options (`sentenza -p awesome-cli command <argument> --option value` => `npx sentenza-awesome-cli@latest command <argument> --option value`).

All environment variables are also forwarded.
