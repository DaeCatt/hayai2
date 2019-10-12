/**
 * Cookie Handler for Hayai2
 */

/**
 * @typedef {InstanceType<import('hayai2')['Http1Request']>|InstanceType<import('hayai2')['Http2Request']>} HttpRequest
 */

"use strict";
class Cookies {
	/** @type {Set<string>} */
	initial = new Set();
	/** @type {Map<string,string>} */
	current = new Map();
	/** @type {Map<string,string>} */
	pending = new Map();

	/**
	 * Ask the client to clear all cookies.
	 */
	clear() {
		this.pending.clear();
		this.current.clear();
		for (const name of this.initial) this.delete(name);
	}

	/**
	 * Delete specified cookie.
	 * @param {string} name
	 */
	delete(name) {
		const removed = this.current.delete(name);

		if (this.initial.has(name)) {
			this.set(name, "", { maxAge: -1 });
			return removed;
		}

		this.pending.delete(name);
		return removed;
	}

	entries() {
		return this.current.entries();
	}

	/**
	 * Get specified current cookie.
	 * @param {string} name
	 */
	get(name) {
		return this.current.get(name);
	}

	/**
	 * Whether the specified cookie currently exists.
	 * @param {string} name
	 */
	has(name) {
		return this.current.has(name);
	}

	/**
	 * Get the names of all specified cookies.
	 */
	keys() {
		return this.current.keys();
	}

	/**
	 *
	 * @param {string} name
	 * @param {string} value
	 * @param {Object} options Cookie options
	 * @param {number=} options.maxAge For how long the client will keep sending
	 * the cookie in seconds. Defaults to `0`, making the cookie a session
	 * cookie that will be sent until the browser is closed (but may be restored
	 * if browser restore functionality is used). A negative value can be used
	 * to make the cookie immediately expire.
	 * @param {string=} options.domain Domain postfix which the cookie will be
	 * sent for. Defaults to `""`, which means the cookie will only be sent to
	 * the exact domain that set the cookie. A value of "example.org" would ALSO
	 * send cookies to "sub.example.org".
	 * @param {string=} options.path Path prefix which the cookie will be sent
	 * for. Defaults to `"/"`.
	 * @param {boolean=} options.secure Whether the cookie only sent in secure
	 * contexts. Defaults to `true`.
	 * @param {boolean=} options.httpOnly Whether the cookie is accessible by
	 * JavaScript. Defaults to `true`, making the cookie inaccessible to
	 * JavaScript.
	 * @param {"Strict"|"Lax"|"None"|""=} options.sameSite Whether the cookie
	 * will be sent for cross-site requests. Defaults to `"Lax"`. Read more
	 * here:
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#SameSite_cookies
	 * and here: https://www.chromestatus.com/feature/5088147346030592
	 */
	set(
		name,
		value,
		{
			maxAge = 0,
			domain = "",
			path = "/",
			secure = true,
			httpOnly = true,
			sameSite = "Lax"
		} = {}
	) {
		let string = Cookies.encode(name) + "=" + Cookies.encode(value);

		if (maxAge !== 0) {
			string +=
				"; Expires=" +
				Cookies.encode(
					maxAge < 0
						? "Thu, 01 Jan 1970 00:00:00 GMT"
						: new Date(Date.now() + maxAge * 1000).toUTCString()
				);
		}

		if (domain !== "") string += "; Domain=" + Cookies.encode(domain);
		if (path !== "") string += "; Path=" + Cookies.encode(path);
		if (secure) string += "; Secure";
		if (httpOnly) string += "; HttpOnly";
		if (sameSite !== "") string += "; SameSite=" + Cookies.encode(sameSite);

		this.pending.set(name, string);
		if (maxAge >= 0) this.current.set(name, value);
		return this;
	}

	/**
	 * Set Set-Cookie header on supplied headers object or create headers objects.
	 *
	 * @param {import("http2").OutgoingHttpHeaders} headers
	 * @return {headers}
	 */
	setCookies(headers = {}) {
		if (this.pending.size === 0) return headers;
		headers["set-cookie"] = [...this.pending.values()];
		return headers;
	}

	[Symbol.iterator]() {
		return this.entries();
	}

	/**
	 * Create Cookies object and attach outgoing cookies on respond.
	 * @param {HttpRequest} request
	 */
	static bind(request) {
		const cookies = Cookies.fromString(request.headers["cookie"]);
		const respond = request.respond.bind(request);
		request.respond = (status, headers) =>
			respond(status, cookies.setCookies(headers));

		return cookies;
	}

	/**
	 * Create Cookies object from incoming Cookie header.
	 *
	 * @param {string} string
	 * @return {Cookies}
	 */
	static fromString(string = "") {
		const cookies = new Cookies();
		if (string === "") return cookies;

		for (const pair of string.split(/; ?/g)) {
			const index = pair.indexOf("=");
			if (index > 0) {
				const name = Cookies.decode(string.slice(0, index));
				const value = Cookies.decode(string.slice(index + 1));
				cookies.current.set(name, value);
				cookies.initial.add(name);
			}
		}

		return cookies;
	}

	/**
	 * Safely decode a cookie key or value.
	 *
	 * @param {string} string
	 * @return {string}
	 */
	static decode(string) {
		try {
			return decodeURIComponent(string);
		} catch (error) {
			return string;
		}
	}

	/**
	 * Encode a cookie key or value.
	 *
	 * @param {string} string
	 * @return {string}
	 */
	static encode(string) {
		return string
			.toString()
			.replace(/([^ /,]+)/, string => encodeURIComponent(string));
	}
}

module.exports = Cookies;
