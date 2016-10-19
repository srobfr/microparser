var microparser = require(__dirname + "/../microparser.js");
var g = microparser.grammarHelper;

// The code to parse.
var code = "I am a text with 3 (nested ((parentheses) blocks))";

// Grammar definition (see example2.js)
var number = /^[0-9]+/;
var taggedNumber = g.tag("number", number);
var word = /^[a-z]+/i;
var spaces = /^[ \t\r\n]+/;
var endOfString = /^$/;

var anythingPlaceHolder = [];
var block = ["(", g.tag("blockContent", anythingPlaceHolder), ")"];
var anything = g.multiple(g.or(taggedNumber, word, spaces, block));
anythingPlaceHolder.push(anything);
var grammar = [anything, endOfString];

// Parse the code multiple times
var $root;
var count = 10000;
var start = new Date();
for(var i = 0; i < count; i++) {
    $root = microparser.parse(code, grammar);
}

var duration = (new Date().getTime() - start.getTime());

console.log(`${count} iterations done in ${duration}ms.`);
