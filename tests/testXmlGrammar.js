var util = require("util");
var microparser = require(__dirname + "/../index.js");
var _ = require("lodash");

var or = microparser.xmlGrammar.or;
var multiple = microparser.xmlGrammar.multiple;
var optional = microparser.xmlGrammar.optional;
var not = microparser.xmlGrammar.not;
var until = microparser.xmlGrammar.until;
var tag = microparser.xmlGrammar.tag;

// Grammaire
var w = /^[\s\t\r\n]+/;
var name = tag("name", /^\w+/);
var surname = tag("surname", /^\w+/);

var names = until(name, w, [w, surname, w, "<"]);
var email = tag("email", /^.+?@.+?\.\w+/);

var g = [
    names, w,
    surname, w,
    "<", email, ">",
    /^$/
];

//console.log(util.inspect(g, {depth: 20, colors: true}));
var grammar = microparser.xmlGrammar.convert(g);
var parser = new microparser.parser.Parser(grammar);
var r = parser.parse("Simon L Robert <srob@srob.fr>");

console.log(util.inspect(r, {depth: 20, colors: true}));
console.log(_.flattenDeep(r).join(""));

