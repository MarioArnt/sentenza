# Sentenza

<p align="center">
  <img src="https://github.com/MarioArnt/sentenza/blob/master/sentenza.jpg?raw=true" alt="The Bad"/>
</p>

Sentenza helps you to trigger builds from a pipeline.

From a script, another pipeline, your laptop... no matter.

Sentenza always follow his job through. You know that.

Sentenza offers a command line interface (CLI) and a Javascript/Typescript API.

## Official providers

Sentenza offers an extensible API that allow community to write and maintain adaptors for the different CI providers.

An official provider is part of this monorepo, so it has been written or reviewed by sentenza maintainers.

Here are the currently supported providers:

* [Bitbucket Pipelines](https://github.com/MarioArnt/sentenza/blob/master/providers/bitbucket/README.md)

## Community providers

There are no providers yet for others continuous integration tools.

If you want to write your own provider, get started by reading [this guide](https://github.com/MarioArnt/sentenza/blob/master/providers/GUIDE.md).

We are looking for volunteers to develop adaptors for:

* Travis
* Gitlab CI
* Circle CI

You can either submit a PR on this repository with your provider in `providers/{your-provider}`.
We will review and merge your code, and your provider added to the list of official providers.

If you prefer to store the code in your own repository and have control on NPM publish process, yo can do it.

In this case, please submit a PR modifying the README.md and adding your provider in "community providers" if you want it to appear here.

## Usage

Sentenza cannot do much without his fellow providers...

Check the documentation of the target provider for detailed guidance.

### CLI

Install `sentenza` in your project using `npm i -D sentenza`

Now you can run `npx sentenza --version` to see currently installed version

#### Using specific version for providers

Sentenza CLI uses ``npx`` under the hood to call provider's CLI. So you can use any version of the provider this way:

``npx sentenza -p bitbucket@0.0.6 --help``

### Debugging

Sentenza use [debug](https://github.com/visionmedia/debug) package to manage debug logs. Activate them by setting ``DEBUG=sentenza`` in your environment.
