"use strict";

/**
 * @param {TemplateStringsArray} strings
 * @param  {...any} values
 * @return {string} regex string
 */
module.exports = (strings, ...values) => {
	const lastIndex = strings.length - 1;
	let pattern = "";
	let value;

	for (let i = 0; i < strings.length; ++i) {
		pattern += strings.raw[i]
			// remove block comments
			.replace(/\/\*(?:.|\n)*?\*\//g, "")
			// remove end-of-line comments
			.replace(/(?<!\\)((?:\\{2})*)\/\/.*$/gm, "$1")
			// remove non-escaped whitespace
			.replace(/(?<!\\)((?:\\{2})*)\s+/g, "$1");

		if (i < lastIndex) {
			value = values[i];
			if (value instanceof RegExp) {
				pattern += `(?:${value.source})`;
			} else {
				pattern += value
					.toString()
					.replace(/([\\\^\$\*\+\?\.\(\)\[\]\{\}])/g, "\\$1");
			}
		}
	}

	return pattern;
};
