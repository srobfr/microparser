var util = require("util");
var microparser = require(__dirname + "/../index.js");
var _ = require("lodash");

var g = microparser.xmlGrammar;

// Grammaire
var w = /^[\s\t\r\n]+/;

var email = g.tag("email", /^.+?@.+?\.\w+/);
var name = g.tag("name", /^\w+/);
var surname = g.tag("surname", /^\w+/);

var afterName = [w, surname, w, "<", email, ">"];
var names = g.until(name, w, afterName);

var grammar = [
    names, afterName,
    /^$/
];

//console.log(util.inspect(g, {depth: 20, colors: true}));
var parser = new microparser.parser.Parser(g.convert(grammar));
var r = parser.parse("Simon L Robert <srob@srob.fr>");

console.log(util.inspect(r, {depth: 20, colors: true}));
console.log(_.flattenDeep(r).join(""));

