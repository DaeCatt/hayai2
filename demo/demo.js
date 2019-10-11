/**
 * Demo for Hayai2 Server
 */

"use strict";
const streamFs = require("fs");
const fs = streamFs.promises;
const path = require("path");

const { createServer } = require("../hayai");
const Cookies = require("../cookies");

const ERROR_NAMES = new Map([
	[400, "Bad Request"],
	[401, "Unauthorized"],
	[403, "Forbidden"],
	[404, "Not Found"],
	[405, "Method Not Allowed"]
]);

const error = (request, status = 400, headers = {}) => {
	const errorName = ERROR_NAMES.has(status)
		? ERROR_NAMES.get(status)
		: "Error";

	const payload = `<!doctype html><title>${status} - ${errorName}</title><h1>${status} - ${errorName}</h1>`;
	const response = request.respond(status, {
		"content-length": Buffer.byteLength(payload),
		"content-type": "text/html; charset=utf-8",
		...headers
	});

	response.end(payload);
};

async function main() {
	const [cert, key] = await Promise.all([
		fs.readFile("./localhost.crt"),
		fs.readFile("./localhost.key")
	]);

	await createServer({ cert, key }, async request => {
		const cookies = Cookies.fromString(request.headers["cookie"]);
		cookies.bindRequest(request);
		if (!cookies.has("session")) cookies.set("session", "session-cookie");

		let mimeType = "application/octet-stream";
		let targetFile = "";
		switch (request.pathname) {
			case "/":
			case "/index.html": {
				mimeType = "text/html; charset=utf-8";
				targetFile = "index.html";
				break;
			}
			case "/style.css": {
				mimeType = "text/css; charset=utf-8";
				targetFile = "style.css";
				break;
			}
		}

		if (targetFile === "") return error(request, 404, cookies.setCookies());

		let lastModified = "";
		let size = 0;
		try {
			const stat = await fs.stat(targetFile);
			if (!stat.isFile())
				return error(request, 404, cookies.setCookies());

			size = stat.size;
			lastModified = stat.mtime.toUTCString();
		} catch (e) {
			return error(request, 404, cookies.setCookies());
		}

		if (request.headers["if-modified-since"] === lastModified)
			return request.respond(304, cookies.setCookies()).end();

		const response = request.respond(
			200,
			cookies.setCookies({
				"content-type": mimeType,
				"content-length": size,
				"last-modified": lastModified
			})
		);

		if (request.method === "HEAD") return response.end();
		streamFs.createReadStream(targetFile).pipe(response);
	});
}

main().catch(e => process.stderr.write(e.toString() + "\n"));
