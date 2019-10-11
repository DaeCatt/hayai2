"use strict";

const stream = require("stream");

class HttpGenericRequest {
	/** @type {stream.PassThrough} */
	body = new stream.PassThrough();

	/** @type {import("http2").IncomingHttpHeaders} */
	headers = Object.create(null);
	/** @type {string} */
	method = "";
	/** @type {string} */
	hostname = "";
	/** @type {string} */
	pathname = "";
	/** @type {URLSearchParams} */
	searchParams = null;
	/** @type {boolean} */
	canPush = false;

	/** @readonly */
	responded = false;

	/**
	 * @param {import("http2").IncomingHttpHeaders} headers
	 * @param {string} method
	 * @param {string} host
	 * @param {string} url
	 * @param {boolean=} canPush
	 */
	constructor(headers, method, host, url, canPush = false) {
		Object.assign(this.headers, headers);
		this.method = method.toUpperCase();

		const parsedURL = new URL(url, "https://" + host);
		this.hostname = parsedURL.hostname;
		this.pathname = parsedURL.pathname;
		this.searchParams = parsedURL.searchParams;

		this.canPush = canPush;
	}
}

class Http1Request extends HttpGenericRequest {
	/** @type {import("http2").Http2ServerResponse} */
	_response = null;

	/**
	 * @param {import("http2").Http2ServerRequest} request
	 * @param {import("http2").Http2ServerResponse} response
	 */
	constructor(request, response) {
		super(
			request.headers,
			request.method,
			request.headers["host"],
			request.url
		);
		this._response = response;

		request.pipe(this.body);
	}

	/**
	 * @param {number=} status
	 * @param {import("http2").OutgoingHttpHeaders} headers
	 * @return {stream.Writable}
	 */
	respond(status = 200, headers = {}) {
		if (this.responded)
			throw new Error("Response already initiated for request.");

		this.responded = true;
		this._response.writeHead(status, headers);

		const passthrough = new stream.PassThrough();
		passthrough.pipe(this._response);
		return passthrough;
	}
}

class Http2Request extends HttpGenericRequest {
	/** @type {import("http2").ServerHttp2Stream} */
	_stream = null;

	/**
	 * @param {import("http2").ServerHttp2Stream} stream
	 * @param {import("http2").IncomingHttpHeaders} headers
	 */
	constructor(stream, headers) {
		super(
			headers,
			headers[":method"],
			headers[":authority"],
			headers[":path"],
			stream.pushAllowed
		);

		this._stream = stream;
		stream.pipe(this.body);
	}

	/**
	 * @param {number=} status
	 * @param {import("http2").OutgoingHttpHeaders} headers
	 * @return {stream.Writable}
	 */
	respond(status = 200, headers = {}) {
		if (this.responded)
			throw new Error("Response already initiated for request.");

		this.responded = true;
		this._stream.respond({ ":status": status, ...headers });

		const passthrough = new stream.PassThrough();
		passthrough.pipe(this._stream);
		return passthrough;
	}

	/**
	 * @param {string} path
	 * @param {number=} status
	 * @param {import("http2").OutgoingHttpHeaders} headers
	 * @return {Promise<stream.Writable>}
	 */
	async push(path, status = 200, headers = {}) {
		return new Promise((resolve, reject) => {
			this._stream.pushStream(
				{ ":path": path, ":status": status, ...headers },
				(error, http2Stream) => {
					if (error) return reject(error);
					http2Stream.respond();

					const passthrough = new stream.PassThrough();
					passthrough.pipe(http2Stream);
					resolve(passthrough);
				}
			);
		});
	}
}

module.exports = { HttpGenericRequest, Http1Request, Http2Request };
