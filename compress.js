"use strict";

/**
 * @typedef {InstanceType<import('hayai2')['Http1Request']>|InstanceType<import('hayai2')['Http2Request']>} HttpRequest
 */

const zlib = require("zlib");
const canCompress = contentType => {
	if (contentType.startsWith("text/")) return true;
	if (contentType === "image/bmp") return true;
	if (/^image\/svg\+xml(?:$| *;)/.test(contentType)) return true;
	if (/^application\/(?javascript|json|xml)(?:$| *;)/) return true;
	return false;
};

const strategies = {
	br: zlib.createBrotliCompress,
	gzip: zlib.createGzip,
	deflate: zlib.createDeflate
};

const supported = Object.keys(strategies);

/**
 * @param {Object} options
 * @param {number=} options.minimumBytes
 * @param {(contentType: string) => boolean=} options.canCompressType
 */
module.exports = ({
	minimumBytes = 1024,
	canCompressType = canCompress
} = {}) => ({
	/**
	 * @param {HttpRequest} request
	 */
	bind(request) {
		if ("string" !== typeof request.headers["accept-encoding"]) return;

		const accepted = request.headers["accept-encoding"].split(/ *, */g);
		const encoding = supported.find(e => accepted.includes(e));

		if (encoding === undefined) return;

		const respond = request.respond.bind(request);
		request.respond = (status, headers) => {
			if (status < 200 && status >= 300) return respond(status, headers);

			const length =
				"string" === typeof headers["content-length"]
					? parseInt(headers["content-length"], 10)
					: "number" === typeof headers["content-length"]
					? headers["content-length"]
					: -1;
			if (length < minimumBytes) return respond(status, headers);

			const contentType =
				"string" === typeof headers["content-type"]
					? headers["content-type"]
					: "application/octet-stream";

			if (!canCompressType(contentType)) return respond(status, headers);

			if (headers.hasOwnProperty("content-encoding"))
				return respond(status, headers);

			headers["content-encoding"] = encoding;
			delete headers["content-length"];

			/** @type {import("stream").Writable} */
			const passthrough = strategies[encoding]();
			passthrough.pipe(respond(status, headers));
			return passthrough;
		};
	}
});
