var _ = require("lodash");

/**
 * Provides helper methods for the grammars definition.
 * @constructor
 */
function GrammarHelper() {
    var that = this;

    /**
     * Matches any of the specified nodes.
     * @param grammarA
     * @param grammarB
     * @return {{type: string, value: Array}}
     */
    that.or = function(grammarA, grammarB) {
        return {type: "or", value: _.toArray(arguments)};
    };

    /**
     * Matches if subnode does not match.
     * @param grammar
     * @return {{type: string, value: *}}
     */
    that.not = function(grammar) {
        return {type: "not", value: grammar};
    };

    /**
     * Matches if subnode matches, without going forward.
     * @param grammar
     * @return {{type: string, value: *}}
     */
    that.test = function(grammar) {
        return {type: "test", value: grammar};
    };

    /**
     * Always matches. Go forward if subnode matches.
     * @param grammar
     * @return {{type, value}|{type: string, value: Array}}
     */
    that.optional = function(grammar) {
        return that.or(grammar, that.not(grammar));
    };

    /**
     * Tries to match at least one time the subnode, optionally with a separator between each occurrence.
     * @param grammar
     * @param separator
     * @return {*[]}
     */
    that.multiple = function(grammar, separator) {
        return [
            grammar,
            {type: "multiple", value: (separator === undefined ? grammar : [separator, grammar])}
        ];
    };

    /**
     * Tries to match at least one time the subnode, optionally with a separator between each occurrence,
     * until the following node matches <next>.
     * @param grammar
     * @param separator
     * @param next
     * @return {*[]}
     */
    that.until = function(grammar, separator, next) {
        var notNext = that.not(next);
        var one = [notNext, grammar];
        var s = (separator ? [notNext, separator] : undefined);
        return that.multiple(one, s);
    };

    /**
     * Decorates the result of a matching node.
     * @param grammar
     * @param decorator
     * @return {{type: string, value: *, decorator: *}}
     */
    that.decorate = function(grammar, decorator) {
        return {type: "decorate", value: grammar, decorator: decorator};
    };

    /**
     * Decorates the result of a matching node, wrapping it in XML markups.
     * @param tag
     * @param grammar
     * @return {{type, value, decorator}|{type: string, value: *, decorator: *}}
     */
    that.tag = function(tag, grammar) {
        return that.decorate(grammar, function(result) {
            return ["<" + tag + ">", result, "</" + tag + ">"];
        });
    };
}

module.exports = GrammarHelper;


