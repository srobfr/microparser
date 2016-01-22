var microparser = {};
module.exports = microparser;

microparser.shortGrammar = require(__dirname + "/shortGrammar.js");
microparser.grammarChainer = require(__dirname + "/grammarChainer.js");
microparser.Parser = require(__dirname + "/Parser.js");
