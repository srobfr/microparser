var microparser = require(__dirname + "/../index.js");
//var microparser = require('microparser');
var g = microparser.xmlGrammar;

var code = "green, blue and red";

// Grammar definition
var color = g.tag("color", g.or("green", "blue", "red", "yellow"));
var separator = g.or(", ", " and ");
var grammar = g.multiple(color, separator);

// Parsing
var xml = g.parse(code, grammar);
console.log(xml);

