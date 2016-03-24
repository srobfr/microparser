var util = require("util");
var microparser = require(__dirname + "/../index.js");
var _ = require("lodash");

var g = microparser.xmlGrammar;

// Grammaire
var w = /^[\s\t\r\n]+/;

var name = g.tag("name", /^\w+/);
var surname = g.tag("surname", "Robert");
var email = g.tag("email", /^.+?@.+?\.\w+/);

var afterName = [w, surname, w, "<", email, ">"];
var names = g.until(name, w, afterName);

var grammar = [
    names, afterName,
    /^$/
];

var code = "Simon S Robert <srob@srob.fr>";

var G = g.convert(grammar);
//console.log(util.inspect(G, {depth: 20, colors: true}));
var parser = new microparser.parser.Parser(G);
var r = parser.parse(code);

console.log(util.inspect(r, {depth: 20, colors: true}));
console.log(_.flattenDeep(r).join(""));

