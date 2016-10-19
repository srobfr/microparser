var microparser = require(__dirname + "/../microparser.js");
var g = microparser.grammarHelper;

// The code to parse.
var code = "green, blue and red";

// Grammar definition
var color = g.tag("color", g.or("green", "blue", "red", "yellow"));
var separator = g.or(", ", " and ");
var grammar = g.multiple(color, separator);

// Parsing
var $root = microparser.parse(code, grammar);

console.log("#### Full DOM XML ####");
console.log($root.$.xml());

console.log("\n#### First color element XML ####");
console.log($root.find("color").eq(0).xml());

console.log("\n#### Last color element value ####");
console.log($root.find("color").last().text());

console.log("\n#### Color values ####");
console.log($root
    .find("color")
    .toArray()
    .map(function(colorNode) {
        // JQuery style.
        return $root.$(colorNode).text();
    })
    .join(", "));

