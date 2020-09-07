<div align="center">
<h1>
  <img src="/assets/banner.jpg?raw=true" alt="nextjs-api-common-middleware" />
</h1>

<a href="https://nextjs-common-middleware.kldzj.dev/">Docs</a>
&nbsp;&nbsp;&bull;&nbsp;&nbsp;
<a href="https://github.com/kldzj/nextjs-api-common-middleware/issues">Issues</a>
&nbsp;&nbsp;&bull;&nbsp;&nbsp;
<a href="https://www.npmjs.com/package/nextjs-api-common-middleware">NPM</a>
&nbsp;&nbsp;&bull;&nbsp;&nbsp;
<span>Examples <small><i>(coming some time)</i></small></span>

</div>

<br>

<div align="center">

![Version](https://img.shields.io/github/package-json/v/kldzj/nextjs-api-common-middleware) ![Open issues](https://img.shields.io/github/issues/kldzj/nextjs-api-common-middleware) [![Build status](https://badge.buildkite.com/62d22a820f444be118932f0938c7ee278ef330b9c8bcd56c89.svg)](https://buildkite.com/kldzj/nextjs-api-common-middleware) ![Dependency status](https://img.shields.io/david/kldzj/nextjs-api-common-middleware) ![Snyk status](https://img.shields.io/snyk/vulnerabilities/github/kldzj/nextjs-api-common-middleware) [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkldzj%2Fnextjs-api-common-middleware.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkldzj%2Fnextjs-api-common-middleware?ref=badge_shield)

</div>

<br>

## What this is about

This package exports some common [Next.js](https://nextjs.org/) API middleware patterns that you might need across different applications. It aims to provide useful and mostly flexible drop-in functions.

### What is included

-   Authorization: Basic, Bearer (JWT), Custom
-   Route Guarding: Make sure certain fields are present in the request
-   RESTify Your Routes: A simple function allowing you to map different handlers to http methods
-   Error Catching: Wrap your handlers with a convenient error handling middleware

If you have something in mind that is generally help- or useful and is not included in this list, please feel free to open an issue.

## Getting Started

### Installation

#### Yarn

```console
yarn add nextjs-api-common-middleware
```

#### NPM

```console
npm install --save nextjs-api-common-middleware
```

### Configuration

While generally not required, it is recommended that you re-export the middleware collection with your own default configuration.

Create a file called `middleware.js`/`middleware.ts` somewhere that suits you well, the contents of the file should look something like this:

```javascript
import { createExport } from 'nextjs-api-common-middleware';

const m = createExport({
	catch: (_req, res, err) => {
		console.error(err);
		res.status(500).send('An unknown error occurred');
	},
	auth: {
		strategy: 'custom',
		custom: (authHeaderValue, _req) => {
			if (authHeaderValue && authHeaderValue === 'test') {
				return {
					uid: 123,
					user: {
						firstname: 'Test',
						lastname: 'User',
					},
				};
			}
			return null;
		},
	},
});

export default m;
```

### Usage

#### Basic Example

```javascript
// src/pages/api/hello.js
import m from '../../middleware'; // or 'nextjs-api-common-middleware'

async function handler(req, res) {
	res.json({ hello: 'world' });
}

export default m.auth(handler); // second argument could be additional options
```

#### Chaining Middleware

```javascript
// src/pages/api/hello.js
import m from '../../middleware'; // or 'nextjs-api-common-middleware'

async function handler(req, res) {
	res.json({ hello: 'world' });
}

export default m._.chain([m.auth, m.guard], handler, {
	// auth options are still remembered from the initial configuration
	guard: {
		required: ['foo'],
	},
});
```


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkldzj%2Fnextjs-api-common-middleware.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkldzj%2Fnextjs-api-common-middleware?ref=badge_large)
