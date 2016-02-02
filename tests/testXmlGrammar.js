var util = require("util");
var microparser = require(__dirname + "/../index.js");
var _ = require("lodash");

var or = microparser.xmlGrammar.or;
var multiple = microparser.xmlGrammar.multiple;
var multipleUngreedy = microparser.xmlGrammar.multipleUngreedy;
var optional = microparser.xmlGrammar.optional;
var tag = microparser.xmlGrammar.tag;

// Grammaire
var w = /^[\s\t\r\n]+/;
var name = /^\w+/;
var g = [
    multipleUngreedy(name, w),
    w,
    "<", tag("email", /^.+?@.+?\.\w+/), ">",
    /^$/
];

var grammar = microparser.xmlGrammar.convert(g);

var parser = new microparser.parser.Parser(grammar);
var r = parser.parse("Simon Robert <srob@srob.fr>");

console.log(util.inspect(r, {depth: 20, colors: true}));
console.log(_.flattenDeep(r).join(""));

