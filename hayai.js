/**
 * Hayai2 HTTP/2 Server Helper
 */

"use strict";

const http = require("http");
const http2 = require("http2");

const {
	HttpGenericRequest,
	Http1Request,
	Http2Request
} = require("./lib/Request");
const HayaiServer = require("./lib/Server");

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

/**
 * @param {Object} options
 * @param {(request: Http1Request|Http2Request) => Promise<void>} listener
 * @return {Promise<HayaiServer>}
 */
const createServer = async ({ port = 443, ...options } = {}, listener) => {
	if (!(listener instanceof AsyncFunction))
		throw new Error(`listener must be async function.`);

	const server = new HayaiServer();
	server.addServer(
		http2.createSecureServer(
			{ allowHTTP1: true, ...options },
			async (nodeRequest, nodeResponse) => {
				const isHttp1 = !nodeRequest.stream;

				if (isHttp1 && !nodeRequest.headers["host"]) {
					nodeResponse.writeHead(400);
					return nodeResponse.end("HTTP1_HOST_HEADER_REQUIRED");
				}

				if (!isHttp1 && !nodeRequest.headers[":authority"]) {
					nodeResponse.writeHead(400);
					return nodeResponse.end("HTTP2_AUTHORITY_HEADER_REQUIRED");
				}

				const request = isHttp1
					? new Http1Request(nodeRequest, nodeResponse)
					: new Http2Request(nodeRequest.stream, nodeRequest.headers);

				try {
					await listener(request);
				} catch (e) {
					server.emit("error", e);
				} finally {
					// TODO: Add logic to handle streams which haven't been handled correctly.
				}
			}
		),
		port
	);

	if (port === 443) {
		server.addServer(
			http.createServer((request, response) => {
				if (!request.headers["host"]) {
					response.writeHead(400);
					return response.end("HTTP1_HOST_HEADER_REQUIRED");
				}

				response.writeHead(301, {
					Location: "https://" + request.headers["host"] + request.url
				});

				return response.end();
			}),
			80
		);
	}

	await server.ready;
	return server;
};

module.exports = {
	createServer,
	HayaiServer,
	HttpGenericRequest,
	Http1Request,
	Http2Request
};
