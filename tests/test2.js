var util = require("util");
var microparser = require(__dirname + "/../index.js");
var _ = require("lodash");

var or = microparser.shortGrammar.or;
var multiple = microparser.shortGrammar.multiple;
var optional = microparser.shortGrammar.optional;

// Grammaire
var w = /^[\s\t\r\n]+/;
var wo = optional(w);
var ident = /^[a-zA-Z_$][a-zA-Z\d_$]*/;
var fullIdent = multiple(ident, ".");
var packageLine = ["package", w, fullIdent, ";"];
var importLine = ["import", w, fullIdent, ";"];
var importLines = [importLine];
importLines.push(or([w, importLines], ""));

var g = [
    packageLine, wo,
    importLines, " ",
    /^$/
];

var grammar = microparser.shortGrammar.convert(g);
console.log(util.inspect(grammar, {depth: 20, colors: true}));


var parser = new microparser.Parser(grammar);

var r = parser.parse("package foo; import a; ");

console.log(util.inspect(_.flattenDeep(r), {depth: 20, colors: true}));

