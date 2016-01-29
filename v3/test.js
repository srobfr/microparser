var util = require("util");
var microparser = require(__dirname + "/index.js");
var _ = require("lodash");

var or = microparser.shortGrammar.or;
var multiple = microparser.shortGrammar.multiple;
var optional = microparser.shortGrammar.optional;
var decorate = microparser.shortGrammar.decorate;

// Grammaire
var w = decorate(/^[\s\t\r\n]+/, function(result) {return ["<white>", result, "</white>"];});
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
var parser = new microparser.parser.Parser(grammar);

var r = parser.parse("package foo.bar.baz; import a; ");

console.log(util.inspect(r, {depth: 20, colors: true}));

