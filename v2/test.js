var util = require("util");
var microparser = require(__dirname + "/index.js");
var _ = require("lodash");


var grammar = new microparser.grammar.Sequence([
    new microparser.grammar.String("plop"),
    new microparser.grammar.Or([
        new microparser.grammar.String("OR1"),
        new microparser.grammar.String("OR2")
    ]),
    new microparser.grammar.String("foo")
]);

//var linkedGrammarGraph = microparser.linkedGrammar.create(grammar);

var parser = new microparser.parser.Parser(grammar);
var result = parser.parse("plopOR1foo");

console.log(util.inspect(result, {depth: 100, colors: true}));

