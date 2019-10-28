/**
 * Used to generate lib/HttpHeaders.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

/** @param {string} string */
const toCamelCase = string =>
	string
		.toLowerCase()
		.split(/-/g)
		.map((s, i) => (i === 0 ? s : s[0].toUpperCase() + s.slice(1)))
		.join("");

/** @type {Object<string,{typedef?: string, defaultValue?: any, add?: string, set: string, encode: string}>} */
const TYPE_O = {
	Negotiation: {
		typedef: "{parameter: string, q: number}[]",
		set: ``,
		encode: ``
	},
	CacheControl: {
		typedef: "{directive: string, seconds: number}",
		set: ``,
		encode: ``
	},
	Ranges: {
		typedef:
			"{unit: string, ranges: ({start: number, end: number}|{start:number}|{end:number})[]}",
		set: ``,
		encode: ``
	},
	ContentRange: {
		typedef: "{unit: string, start: number, end: number, size: number}",
		set: ``,
		encode: ``
	},
	ETag: {
		typedef: "{weak: boolean, tag: string}",
		set: ``,
		encode: ``
	},
	CSP: {
		typedef: "{directive: string, sources: string[]}[]",
		set: ``,
		encode: ``
	},
	FeaturePolicy: {
		typedef: "{directive: string, allowlist: string[]}[]",
		set: ``,
		encode: ``
	},
	MediaType: {
		typedef: "MediaType",
		set: `this[name] = MediaType.fromString(value);`,
		encode: `value.toString()`
	},
	Date: {
		set: `this[name] = parseHttpDate(value);`,
		encode: `value.toUTCString()`
	},
	"string[]": {
		defaultValue: [],
		add: `this[name].push(...value.split(/ *, */g).filter(s => s.length));`,
		set: `this[name] = value.split(/ *, */g).filter(s => s.length);`,
		encode: 'value.join(",")'
	},
	string: {
		defaultValue: "",
		set: `this[name] += (this[name] !== "" ? "," : "") + value;`,
		encode: `value`
	},
	boolTrue: {
		set: `this[name] = value === "true";`,
		encode: `value ? "true" : void 0`
	},
	number: {
		set: `this[name] = parseInt(value, 10);`,
		encode: `value.toString(10)`
	},
	cookie: {
		defaultValue: [],
		add: `this[name].push(...value.split(/ *; */g).filter(s => s.length));`,
		set: `this[name] = value.split(/ *; */g).filter(s => s.length);`,
		encode: `value.join(";")`
	},
	boolean: {
		set: `this[name] = value === "1";`,
		encode: `value ? "1" : "0"`
	},
	boolOn: {
		set: `this[name] = value === "on";`,
		encode: `value ? "on" : "off"`
	}
};

const TYPES = new Map(Object.entries(TYPE_O));

/**
 * @type {Object<string, {
 * type: string,
 * typedef?: string,
 * responseHeader?: true,
 * requestHeader?: true,
 * defaultValue?: string,
 * discardDuplicate?: true
 * }>}
 */
const HEADERS = {
	Accept: {
		type: "Negotiation",
		requestHeader: true
	},
	"Accept-Charset": {
		type: "Negotiation",
		requestHeader: true
	},
	"Accept-Datetime": {
		type: "Date",
		requestHeader: true
	},
	"Accept-Encoding": {
		type: "Negotiation",
		requestHeader: true
	},
	"Accept-Language": {
		type: "Negotiation",
		requestHeader: true
	},
	"Accept-Patch": {
		type: "string[]",
		responseHeader: true
	},
	"Accept-Ranges": {
		type: "string",
		responseHeader: true
	},
	"Access-Control-Allow-Credentials": {
		type: "boolTrue",
		typedef: "boolean",
		responseHeader: true,
		discardDuplicate: true
	},
	"Access-Control-Allow-Headers": {
		type: "string[]",
		responseHeader: true
	},
	"Access-Control-Allow-Methods": {
		type: "string[]",
		responseHeader: true
	},
	"Access-Control-Allow-Origin": {
		type: "string",
		responseHeader: true
	},
	"Access-Control-Expose-Headers": {
		type: "string[]",
		responseHeader: true
	},
	"Access-Control-Max-Age": {
		type: "number",
		responseHeader: true,
		discardDuplicate: true
	},
	"Accept-Control-Request-Method": {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	"Accept-Control-Request-Headers": {
		type: "string[]",
		requestHeader: true
	},
	Age: {
		type: "number",
		responseHeader: true,
		discardDuplicate: true
	},
	Allow: {
		type: "string[]",
		responseHeader: true
	},
	"Alt-Svc": {
		type: "string",
		responseHeader: true
	},
	Authorization: {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	"Cache-Control": {
		type: "CacheControl",
		responseHeader: true,
		requestHeader: true
	},
	Connection: {
		type: "string",
		responseHeader: true,
		requestHeader: true
	},
	"Content-Disposition": {
		type: "string",
		responseHeader: true
	},
	"Content-Encoding": {
		type: "string",
		responseHeader: true,
		discardDuplicate: true
	},
	"Content-Language": {
		type: "string[]",
		responseHeader: true,
		discardDuplicate: true
	},
	"Content-Length": {
		type: "number",
		responseHeader: true,
		requestHeader: true,
		discardDuplicate: true
	},
	"Content-Location": {
		type: "string",
		responseHeader: true,
		discardDuplicate: true
	},
	"Content-Range": {
		type: "ContentRange",
		responseHeader: true,
		discardDuplicate: true
	},
	"Content-Security-Policy": {
		type: "CSP",
		responseHeader: true
	},
	"Content-Type": {
		type: "MediaType",
		responseHeader: true,
		requestHeader: true,
		discardDuplicate: true
	},
	Cookie: {
		type: "cookie",
		typedef: "string[]",
		requestHeader: true
	},
	Date: {
		type: "Date",
		responseHeader: true,
		requestHeader: true,
		discardDuplicate: true
	},
	DNT: {
		type: "boolean",
		requestHeader: true,
		discardDuplicate: true
	},
	ETag: {
		type: "ETag",
		responseHeader: true,
		discardDuplicate: true
	},
	Expect: {
		type: "string",
		requestHeader: true
	},
	"Expect-CT": {
		type: "string",
		responseHeader: true
	},
	Expires: {
		type: "Date",
		responseHeader: true,
		discardDuplicate: true
	},
	"Feature-Policy": {
		type: "FeaturePolicy",
		responseHeader: true
	},
	Forwarded: {
		type: "string",
		requestHeader: true
	},
	From: {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	Host: {
		type: "string",
		requestHeader: true
	},
	"If-Match": {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	"If-Modified-Since": {
		type: "Date",
		requestHeader: true,
		discardDuplicate: true
	},
	"If-None-Match": {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	"If-Range": {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	"If-Unmodified-Since": {
		type: "Date",
		requestHeader: true,
		discardDuplicate: true
	},
	"Last-Modified": {
		type: "Date",
		responseHeader: true,
		discardDuplicate: true
	},
	Link: {
		type: "string[]",
		responseHeader: true
	},
	Location: {
		type: "string",
		responseHeader: true,
		discardDuplicate: true
	},
	"Max-Forwards": {
		type: "number",
		requestHeader: true,
		discardDuplicate: true
	},
	Origin: {
		type: "string",
		requestHeader: true
	},
	"Proxy-Authenicate": {
		type: "string",
		responseHeader: true
	},
	"Proxy-Authorization": {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	Range: {
		type: "Ranges",
		requestHeader: true,
		discardDuplicate: true
	},
	Referer: {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	Refresh: {
		type: "string",
		responseHeader: true
	},
	"Retry-After": {
		type: "string",
		responseHeader: true,
		discardDuplicate: true
	},
	"Save-Data": {
		type: "boolOn",
		typedef: "boolean",
		requestHeader: true
	},
	Server: {
		type: "string",
		responseHeader: true
	},
	"Set-Cookie": {
		type: "string[]",
		responseHeader: true
	},
	"Strict-Transport-Security": {
		type: "string",
		responseHeader: true
	},
	TE: {
		type: "Negotiation",
		requestHeader: true
	},
	"Timing-Allow-Origin": {
		type: "string[]",
		responseHeader: true
	},
	Tk: {
		type: "string",
		responseHeader: true,
		discardDuplicate: true
	},
	"Upgrade-Insecure-Requests": {
		type: "boolean",
		requestHeader: true,
		discardDuplicate: true
	},
	"User-Agent": {
		type: "string",
		requestHeader: true,
		discardDuplicate: true
	},
	Vary: {
		type: "string[]",
		responseHeader: true
	},
	Via: {
		type: "string",
		responseHeader: true,
		requestHeader: true
	},
	Warning: {
		type: "string",
		responseHeader: true,
		requestHeader: true
	},
	"WWW-Authenticate": {
		type: "string",
		responseHeader: true
	},
	"X-Content-Type-Options": {
		type: "string",
		responseHeader: true,
		defaultValue: "nosniff",
		discardDuplicate: true
	},
	"X-Requested-With": {
		type: "string",
		requestHeader: true
	}
};

/** @type {Object<string, {parseCases: Map<string,string[]>, fields: string[], discardDuplicate: string[]}>} */
const classes = {
	HttpHeaders: {
		parseCases: new Map(),
		fields: [],
		discardDuplicate: []
	},
	ResponseHeaders: {
		parseCases: new Map(),
		fields: [],
		discardDuplicate: []
	},
	RequestHeaders: {
		parseCases: new Map(),
		fields: [],
		discardDuplicate: []
	}
};

/** @type {string[]} */
const discardDuplicates = [];

const mappings = new Map();

for (const [
	name,
	{
		type,
		typedef = type,
		responseHeader = false,
		requestHeader = false,
		defaultValue = TYPES.get(type).defaultValue,
		discardDuplicate = false
	}
] of Object.entries(HEADERS)) {
	const lower = name.toLowerCase();
	const fieldName = toCamelCase(lower);
	if (lower !== fieldName) mappings.set(lower, fieldName);

	const fieldDef = `/** @type {${typedef}} */\n${fieldName}${
		defaultValue == null ? "" : ` = ${JSON.stringify(defaultValue)}`
	};`;

	if (discardDuplicate) discardDuplicates.push(fieldName);

	const HTYPE =
		classes[
			responseHeader && requestHeader
				? "HttpHeaders"
				: responseHeader
				? "ResponseHeaders"
				: "RequestHeaders"
		];
	HTYPE.fields.push(fieldDef);
	if (!HTYPE.parseCases.has(type)) HTYPE.parseCases.set(type, []);
	HTYPE.parseCases.get(type).push(fieldName);
}

const formatFieldDefs = list => list.join(`\n`).replace(/\n/g, "\n\t");
/**
 * @param {Map<string,string[]>} map
 */
const formatCases = map =>
	[...map]
		.map(([type, cases]) => {
			return (
				cases.map(a => `case ${JSON.stringify(a)}:`).join("\n") +
				` {
	${TYPES.get(type).add || TYPES.get(type).set}
	return;\n}`
			);
		})
		.join("\n")
		.replace(/\n/g, "\n\t\t\t");

const generateClassDef = className => {
	const isSuper =
		className === "HttpHeaders" ? (a = "", _) => a : (_, b = "") => b;

	return `class ${className} ${isSuper(
		"",
		"extends HttpHeaders"
	)} {${isSuper(`
	/** @type {Map<string,string>} */
	unknownHeaders = new Map;
	/** @type {Set<string>} */
	hset = new Set;
`)}
	${formatFieldDefs(classes[className].fields)}${isSuper(`

	/**
	 * @param {string[]} rawHeaders
	 */
	constructor(rawHeaders = []) {
		for (let i = 0; i < rawHeaders.length; i += 2) {
			this.add(rawHeaders[i], rawHeaders[i | 1]);
		}
	}`)}

	/**
	 * @param {string} name
	 * @param {string} value
	 */
	add(name, value) {
		name = mapName(name);

		if (DISCARD_DUPLICATES.has(name) && this.hset.has(name)) return;
		this.hset.add(name);

		switch (name) {
			${formatCases(classes[className].parseCases)}
		}
		${isSuper(
			`
		const oldValue = this.unknownHeaders.has(name) ? this.unknownHeaders.get(name) : "";
		const addComma = oldValue.length === 0 || !oldValue.endsWith(",");

		this.unknownHeaders.set(name, oldValue + (addComma ? "," : "") + value);`,
			`
		super.add(name, value);`
		)}
	}
}`;
};

fs.writeFileSync(
	path.join(__dirname, "../lib/HttpHeaders.js"),
	`/**
 * @auto-generated
 * generator: build/${path.basename(__filename)}
 *
 * DO NOT EDIT THIS FILE DIRECTLY.
 */

"use strict";

const MediaType = require("./MediaType");

/**
 * ${[...TYPES]
		.filter(([, value]) => value.typedef)
		.map(([name, { typedef }]) => `@typedef {${typedef}} ${name}`)
		.join("\n * ")}
 */

const INVALID_DATE = new Date(NaN);
const HTTP_DATE_RE = /^(?<dayName>Mon|Tue|Wed|Thu|Fri|Sat|Sun), (?<day>0[1-9]|[1-9][0-9]) (?<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (?<year>[1-9][0-9{3,}) (?<hour>[0-9]{2}):(?<minute>[0-9]{2}):(?<second>[0-9]{2}) GMT$/;

/**
 * @param {string} string
 * @return {Date}
 */
const parseHttpDate = string => {
	const match = string.match(HTTP_DATE_RE);
	if (match == null) return INVALID_DATE;
	return new Date(
		parseInt(match.groups.year, 10),
		parseInt(match.groups.month, 10) - 1,
		parseInt(match.groups.day, 10),
		parseInt(match.groups.hour, 10),
		parseInt(match.groups.minute, 10),
		parseInt(match.groups.second, 10)
	);
}

/** @type {Map<string,string>} */
const NORMAL_MAP = new Map(${JSON.stringify([...mappings.entries()], null, "\t")
		.replace(/\n\t\t/g, "")
		.replace(/\n\t\]/g, "]")
		.replace(/","/g, `", "`)});

const REVERSE_MAP = new Map;
for (const [a, b] of NORMAL_MAP) REVERSE_MAP.set(b, a);

const mapName = name => {
	const lower = name.toLowerCase();
	return NORMAL_MAP.has(lower) ? NORMAL_MAP.get(lower) : lower;
};

/** @type {Set<string>} */
const DISCARD_DUPLICATES = new Set(${JSON.stringify(
		discardDuplicates,
		null,
		"\t"
	)});

${Object.keys(classes)
	.map(name => generateClassDef(name))
	.join("\n\n")}

module.exports = {
	HttpHeaders,
	ResponseHeaders,
	RequestHeaders,
	INVALID_DATE
};
`,
	"UTF-8"
);
