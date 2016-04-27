var microparser = require(__dirname + "/../index.js");
//var microparser = require('microparser');

var code = "I am a text with 3 (nested ((parentheses) blocks))";

var g = microparser.xmlGrammar;

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
var grammar = [anything, endOfString];

// Let's parse code into xml code.
var xml = g.parse(code, grammar);

console.log(xml);

