const Context = require('./Context');
const ParseTableBuilder = require('../ParseTable/ParseTableBuilder');
const debug = require('debug')('microparser:parser');

/**
 * The Parser
 * @constructor
 */
function Parser() {
    const that = this;
    const parseTableBuilder = new ParseTableBuilder();

    /**
     * TODO Optimiser ?
     * @param code
     * @param offset
     * @returns {string}
     */
    function substr(code, offset) {
        return code.substr(offset);
    }

    /**
     * Matches a context.
     * @param context
     */
    function matchContext(context) {
        const code = substr(context.code, context.offset);
        const symbol = context.symbol;
        if (context.symbol instanceof String && code.startsWith(context.symbol)) context.matchedCode = symbol.valueOf();
        if (context.symbol instanceof RegExp) {
            const m = code.match(symbol);
            context.matchedCode = (m && m[0]);
        }
    }

    function computeNextContexts(context, parseTable) {
        const nextOffset = context.offset + context.matchedCode.length;
        const transitions = parseTable.transitions.get(context.symbol) || new Set();
        const nextContexts = new Set();
        for (const transition of transitions) {
            const nextContext = new Context();
            nextContext.code = context.code;
            nextContext.offset = nextOffset;
            nextContext.symbol = transition;
            nextContext.previousContext = context;
            nextContexts.add(nextContext);
        }

        return nextContexts;
    }

    /**
     * Parses the given code using the given grammar.
     *
     * @param grammar
     * @param code
     */
    that.parse = function (grammar, code) {
        const parseTable = parseTableBuilder.build(grammar);

        const contexts = new Set(parseTable.firstSymbols.map(symbol => {
            const context = new Context();
            context.symbol = symbol;
            context.code = code;
            return context;
        }));

        // Match contexts
        for (const context of contexts) matchContext(context);

        debug(contexts);
    };
}

module.exports = Parser;