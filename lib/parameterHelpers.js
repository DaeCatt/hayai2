"use strict";

const reTag = require("./RegExpTag");

/**
 * @param {number} x
 * @param {number} lower
 * @param {number} upper
 * @return {number}
 */
const clamp = (x, lower, upper) => Math.min(upper, Math.max(lower, x));

const TOKEN_RE = /[!#\$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]/;
const PARAMETER_RE = new RegExp(
	reTag`;\ ?
	(?<attribute>${TOKEN_RE}+)
	=
	(?<value>${TOKEN_RE}*|"(?:[^"]|\\.)*")`,
	"g"
);

const CODING_RE = new RegExp(reTag`
	(?<coding>${TOKEN_RE}+|\*)
	(?:;\ ?[Qq]=
		(?<q>
			1|
			1\.0+|
			0|
			0\.[0-9]+
		)
	)?`);

const MEDIA_TYPE_RE = new RegExp(reTag`
	(?<media_type>
		${TOKEN_RE}+/${TOKEN_RE}+|
		${TOKEN_RE}+/\*|
		\*/\*
	)
	(?<parameters>${PARAMETER_RE}*)`);

const CODINGS_RE = new RegExp(reTag`${CODING_RE}(?:\ ?,\ ?|$)`, "g");
const MEDIA_TYPES_RE = new RegExp(reTag`${MEDIA_TYPE_RE}(?:\ ?,\ ?|$)`, "g");

const VALID_CODINGS_RE = new RegExp(reTag`(?:(^|,)${CODING_RE})*$`);
const VALID_MEDIA_TYPES_RE = new RegExp(reTag`(?:(^|,)${MEDIA_TYPES_RE})*$`);

/**
 * @typedef {{value: string, q: number}} Coding
 * @typedef {{type: string, subtype: string, q: number, parameters: {[x: string]: string}}} MediaType
 */

/**
 * @param {string} string
 * @return {Coding[]}
 */
const parseCodings = string => {
	if (!VALID_CODINGS_RE.test(string)) return [];

	let lastQValue = 1;
	const codings = [];
	for (const {
		groups: { coding, q }
	} of string.matchAll(CODINGS_RE)) {
		let qValue = lastQValue;
		if (q) {
			const parsed = parseFloat(q);
			if (!Number.isNaN(parsed)) {
				qValue = clamp(parsed, 0, 1);
			}
		}

		lastQValue = qValue;
		codings.push({ value: coding.toLowerCase(), q: qValue });
	}

	return codings;
};

/**
 * @param {string} string
 * @return {MediaType[]}
 */
const parseMediaTypes = string => {
	if (!VALID_MEDIA_TYPES_RE.test(string)) return [];

	let lastQValue = 1;
	const mediaTypes = [];
	for (const {
		groups: { media_type, parameters }
	} of string.matchAll(MEDIA_TYPES_RE)) {
		let params = Object.create(null);
		for (const {
			groups: { attribute, value }
		} of parameters.matchAll(PARAMETER_RE)) {
			params[attribute.toLowerCase()] = value;
		}

		let qValue = lastQValue;
		if (params["q"] != null) {
			let q = "";
			({ q, ...params } = params);

			const parsed = parseFloat(q);
			if (!Number.isNaN(parsed)) {
				qValue = clamp(parsed, 0, 1);
			}
		}

		const [type, subtype] = media_type.toLowerCase().split("/");

		lastQValue = qValue;
		mediaTypes.push({ type, subtype, q: qValue, parameters: params });
	}

	return mediaTypes;
};

module.exports = {
	parseCodings,
	parseMediaTypes
};
