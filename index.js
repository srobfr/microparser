var microparser = {};

microparser.parser = require(__dirname + "/parser.js");
microparser.grammar = require(__dirname + "/grammar.js");
microparser.shortGrammar = require(__dirname + "/shortGrammar.js");
microparser.xmlGrammar = require(__dirname + "/xmlGrammar.js");

module.exports = microparser;
