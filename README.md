# Hayai2 HTTP/2 Server

Hayai2 is an experimental HTTP/2 server helper for NodeJS. It's designed to
minimize the amount of work required to support http/1.1 + https/1.1 + http/2.

**API SUBJECT TO CHANGE**

## Usage

Install:

```sh
yarn install @daecatt/hayai2
```

Use:

```javascript
const { createServer } = require("hayai2");

const [cert, key] = await Promise.all([
	fs.readFile(PATH_TO_CRT),
	fs.readFile(PATH_TO_KEY)
]);

/**
 * No need to .listen, the server is automatically attached to given port.
 * A http-to-https server is automatically created on port 80 if the given port
 * is 443.
 */
createServer({ port: 443, cert, key }, async request => {
	/**
	 * Response stream is created from .respond call.
	 */
	const response = request.respond(200, {
		"content-type": "text/plain; charset=utf-8"
	});

	if (request.method === "HEAD") return response.end();
	return response.end(`Hello world!`);
});
```

## Goals

-   No magic.
-   Automatically handle everything needed to let you develop against HTTP/2.

## Cookie "middleware" Example

API Subject to change.

```javascript
const { createServer } = require("hayai2");
const Cookies = require("hayai2/cookies");

createServer(opts, async request => {
	// Get cookies and modify request.respond to handle outgoing cookies.
	const cookies = Cookies.bind(request);

	// Check whether a cookie exists
	cookies.has("session");

	// Set a cookie
	cookies.set("cookie-banner", "ok");

	// Get a cookie (this always returns "ok", as the cookie was set above
	// even though we haven't actually seen the user send the cookie back).
	cookies.get("cookie-banner");
});
```
