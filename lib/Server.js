/**
 * Hayai2 Server Manager
 */

"use strict";

const EventEmitter = require("events");

/**
 * @typedef {import("http").Server|import("http2").Http2Server} HttpServer
 */

class HayaiServer extends EventEmitter {
	/** @type {HttpServer[]} */
	_servers = [];
	/** @type {Promise[]} */
	_listens = [];

	/**
	 * @param {HttpServer} server
	 * @param {number} port
	 */
	addServer(server, port) {
		this._servers.push(server);
		this._listens.push(
			new Promise((resolve, reject) =>
				server.listen(port, error =>
					error ? reject(error) : resolve()
				)
			)
		);
	}

	get ready() {
		return Promise.all(this._listens);
	}

	/**
	 * Close this HayaiServer.
	 */
	async close() {
		return Promise.all(
			this._servers.map(
				server =>
					new Promise((resolve, reject) =>
						server.close(error =>
							error ? reject(error) : resolve()
						)
					)
			)
		);
	}
}

module.exports = HayaiServer;
