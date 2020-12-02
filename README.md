# Sentenza

Trigger build from a pipeline to another

Offers a extensible API to allow community to write/maintain adaptors for CI providers

* travis adaptor
* bitbucket adaptor
* gitlab adaptor
* circle CI adaptor

Will develop a bitbucket adaptor first

MVP Features:

Trigger a build
Triger a build and wait that build succeed/fail  (using web hoks preferably, long polling if not available)

Usage:

````typescript
const sentenza = new Sentenza({
  provider: 'bitbucket',
  auth: {
    username: process.env.BITBUCKET_USERNAME,
    app_password: process.env.BITBUCKET_APP_PASSWORD,
  },
});


// trigger pipeline dev at the end of dev
sentenza.trigger('dev');

// trigger custom pipeline at the end of specific branch
sentenza.on('staging').trigger({ custom: 'foo' })


// trigger custom pipeline on specific commit
sentenza.on({ commit: 'ce5b743' }).trigger({
  custom: 'foo',
  variables: {
    bar: 'baz',
  }
})

// trigger branch pipeline on specific commit
sentenza.on({ commit: 'ce5b743' }).trigger({ branch: 'dev' })


// pull request (todo)

// wait for pipeline to finish
const pipeline = await sentenza.trigger('dev');

const result = await pipeline.finished();
console.info(result);
// {status: 'failed', url: '', duration: 134 }

// wait for pipeline to suceed, throw otherwise
try {
  await pipeline.succeed();
  console.info('Pipeline suceed \\o/');
  process.exit(0);
} catch (e) {
  console.error('Pipeline failed :S');
  console.error(e);
  process.exit(1);
}
````
