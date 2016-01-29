var microparser = {};

microparser.parser = require(__dirname + "/parser.js");
microparser.grammar = require(__dirname + "/grammar.js");
microparser.shortGrammar = require(__dirname + "/shortGrammar.js");

module.exports = microparser;
