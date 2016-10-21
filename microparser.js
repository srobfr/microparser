var GrammarHelper = require(__dirname + "/GrammarHelper.js");
var Parser = require(__dirname + "/Parser.js");

/**
 * Main component.
 * @constructor
 */
function Microparser() {
    var that = this;

    /**
     * Helper for the grammars definition.
     */
    that.grammarHelper = new GrammarHelper();

    /**
     * Builds a parser using the provided grammar.
     * @param grammar
     * @return {Parser}
     */
    that.buildParser = function (grammar) {
        return new Parser(grammar);
    };

    /**
     * Builds a parser, parses the code then returns the resulting DOM.
     * @param code
     * @param grammar
     * @param $ optional cheerio DOM
     * @return {Cheerio}
     */
    that.parse = function (code, grammar, $) {
        var parser = that.buildParser(grammar);
        return parser.parse(code, $);
    };
}

module.exports = new Microparser();
