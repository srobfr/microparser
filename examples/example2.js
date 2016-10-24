var microparser = require(__dirname + "/../microparser.js");
var g = microparser.grammarHelper;
var $ = microparser.$;

// The code to parse.
var code = "I am a text with 3 (nested ((parentheses) blocks))";

// Grammar definition
// Matches a simple number.
var number = /^[0-9]+/;
// Matches a simple number, and wrap it in <number/> xml tag.
var taggedNumber = g.tag("number", number);
var word = /^[a-z]+/i;
var spaces = /^[ \t\r\n]+/;

// Matches the end of the code.
var endOfString = /^$/;

// We need this to form a cyclic javascript object reference, see below
var anythingPlaceHolder = [];

// A javascript array represents a sequence of matched things.
var block = ["(", g.tag("blockContent", anythingPlaceHolder), ")"];

// This matches at least one taggedNumber, word, spaces or block.
var anything = g.multiple(g.or(taggedNumber, word, spaces, block));

// Here we make the cyclic ref, so blocks can recursively contain blocks
anythingPlaceHolder.push(anything);

// The full grammar is (at least one taggedNumber, word, spaces or block), followed by the end of code.
var grammar = g.tag("root", [anything, endOfString]);

// Compile grammar and build the parser.
var parser = microparser.buildParser(grammar);

// Parse the code
var $root = parser.parse(code);

console.log("#### Full DOM XML ####");
console.log($.xml($root));

