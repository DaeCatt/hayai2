"use strict";

const { parse } = require("./parameterHelpers");

class MediaType {
	type = "";
	subtype = "";
	/** @type {Object<string,string>} */
	parameters = {};
	/** @type {[string,string][]} */
	rawParameters = [];

	/**
	 * @param {string} type
	 * @param {string} subtype
	 * @param {[string,string][]} rawParameters
	 */
	constructor(type, subtype, rawParameters = []) {
		this.type = type;
		this.subtype = subtype;
		this.rawParameters = rawParameters;
		for (const [parameter, value] of rawParameters)
			this.parameters[parameter] = value;
	}

	/**
	 * @return {string}
	 */
	get raw() {
		return this.toString();
	}

	/**
	 * @param {string} mediaTypeString
	 */
	set raw(mediaTypeString) {
		const parsed = MediaType.parseString(mediaTypeString);
		if (!parsed)
			throw new Error(
				"Cannot parse media type string: " + mediaTypeString
			);

		this.type = parsed.type;
		this.subtype = parsed.subtype;
		this.rawParameters = parsed.rawParameters;
		for (const [parameter, value] of parsed.rawParameters)
			this.parameters[parameter] = value;
	}

	/**
	 * @return {string}
	 */
	toString() {
		let paramString = "";
		for (const [key, value] of Object.entries(this.parameters))
			paramString += ";" + key + (value === "" ? "" : "=" + value);

		return this.toSimple() + paramString;
	}

	/**
	 * @return {string}
	 */
	toSimple() {
		return this.type.toLowerCase() + "/" + this.subtype.toLowerCase();
	}

	/**
	 * @param {string} mediaTypeString
	 * @return {MediaType}
	 */
	static fromString(mediaTypeString) {
		const parsed = MediaType.parseString(mediaTypeString);
		if (!parsed) return;

		return new MediaType(parsed.type, parsed.subtype, parsed.rawParameters);
	}

	/**
	 * @param {string} mediaTypeString
	 */
	static parseString(mediaTypeString) {
		const directives = parse(mediaTypeString);
		if (directives.length !== 1) return;

		const directive = directives[0];
		const slashes = directive.value.match(/\//g);
		if (slashes == null || slashes.length !== 1) return;

		const [type, subtype] = directive.value.split(/\//);
		return {
			type: type.toLowerCase(),
			subtype: subtype.toLowerCase(),
			rawParameters: directive.rawParameters
		};
	}
}

module.exports = MediaType;
