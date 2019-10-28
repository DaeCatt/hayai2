"use strict";

const { parseCodings, parseMediaTypes } = require("./parameterHelpers");

/**
 * @typedef {import("./parameterHelpers").Coding} Coding
 * @typedef {import("./parameterHelpers").MediaType} MediaType
 */

class Negotiation {
	/** @type {Coding[]} */
	directives = [];

	/**
	 * @param {Coding[]} directives
	 */
	constructor(directives) {
		for (const directive of directives) this.insert(directive);
	}

	/**
	 * @param {Coding} directive
	 * @return {void}
	 */
	insert(directive) {
		const length = this.directives.length;
		let i = 0;
		while (i < length && this.directives[i].q >= directive.q) ++i;
		if (i < length) {
			this.directives.splice(i, 0, directive);
			return;
		}

		this.directives.push(directive);
	}

	/**
	 * @param {string} string
	 */
	accepts(string) {
		let acceptedByWildcard = false;
		for (const { value, q } of this.directives) {
			if (value === string) return q > 0;
			if (value === "*") acceptedByWildcard = q > 0;
		}

		return acceptedByWildcard;
	}

	/**
	 * @param {string} negotiationString
	 */
	static fromString(negotiationString) {
		return new Negotiation(parseCodings(negotiationString));
	}

	static ANY = Negotiation.fromString("*");
}

class MediaTypeNegotiation {
	/** @type {MediaType[]} */
	directives = [];

	/**
	 * @param {MediaType[]} directives
	 */
	constructor(directives) {
		for (const directive of directives) this.insert(directive);
	}

	/**
	 * @param {MediaType} directive
	 * @return {void}
	 */
	insert(directive) {
		const length = this.directives.length;
		let i = 0;
		while (i < length && this.directives[i].q >= directive.q) ++i;
		if (i < length) {
			this.directives.splice(i, 0, directive);
			return;
		}

		this.directives.push(directive);
	}

	/**
	 * @param {string} mediaTypeNegotiationString
	 */
	static fromString(mediaTypeNegotiationString) {
		return new MediaTypeNegotiation(
			parseMediaTypes(mediaTypeNegotiationString)
		);
	}

	static ANY = MediaTypeNegotiation.fromString("*/*");
}

module.exports = {
	Negotiation,
	MediaTypeNegotiation
};

// text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3

console.log(MediaTypeNegotiation.ANY);
console.log(
	MediaTypeNegotiation.fromString(
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3"
	)
);
