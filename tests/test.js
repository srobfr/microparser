var util = require("util");
var microparser = require(__dirname + "/../index.js");
var fs = require("fs");

var or = microparser.shortGrammar.or;
var multiple = microparser.shortGrammar.multiple;
var optional = microparser.shortGrammar.optional;

function getGrammar() {
    var w = /^[\s\t\r\n]+/;
    var wo = optional(w);
    var ident = /^[a-zA-Z_$][a-zA-Z\d_$]*/;
    var fullIdent = multiple(ident, ".");
    var packageLine = ["package", w, fullIdent, ";"];
    var importLine = ["import", w, fullIdent, ";"];
    var importLines = multiple(importLine, wo);

    var grammar = [
        packageLine, wo,
        importLines,
    ];

    return microparser.shortGrammar.convert(grammar);
}

var code = fs.readFileSync(__dirname + "/sample.java", "UTF-8");
var grammar = getGrammar();

var parser = new microparser.Parser(grammar);
var result = parser.parse(code);
//
//console.log(result);