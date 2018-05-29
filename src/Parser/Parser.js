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
        return code.substring(offset);
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

        return (context.matchedCode !== null);
    }

    function computeNextContexts(context, parseTable) {
        const matchedLength = context.matchedCode ? context.matchedCode.length : 0;
        const nextOffset = context.offset + matchedLength;
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

    function isTerminal(context) {
        const symbol = context.symbol;
        return !(Array.isArray(symbol) || symbol.or !== undefined)
    }

    /**
     * @param context
     * @param reduction
     * @returns {Context|null}
     */
    function findFirstContextOfReduction(context, reduction) {
        let c = context;
        let firstContext = context;
        if (Array.isArray(reduction)) {
            for (let i = reduction.length - 1; i >= 0; i--) {
                if (!c || c.symbol !== reduction[i]) {
                    debug({subReductionFailed: reduction[i], c});
                    return false;
                }
                firstContext = c;
                c = c.previousContext;
            }
        }

        return firstContext;
    }

    /**
     * Parses the given code using the given grammar.
     *
     * @param grammar
     * @param code
     */
    that.parse = function (grammar, code) {
        const parseTable = parseTableBuilder.build(grammar);
        debug({parseTable});

        // Initialize first contexts
        const contextToMatch = new Set(parseTable.firstSymbols.map(symbol => {
            const context = new Context();
            context.symbol = symbol;
            context.code = code;
            return context;
        }));

        const contextsToProcess = new Set();
        const finalContexts = new Set();

        while (contextToMatch.size > 0 || contextsToProcess.size > 0) {
            // Match terminal contexts
            for (const context of contextToMatch) {
                matchContext(context);
                contextToMatch.delete(context);

                if (context.matchedCode !== null) {
                    // The context matched the code.
                    debug({matched: context});
                    contextsToProcess.add(context);
                } else {
                    // The context dit not match the code.
                    debug({matchFailed: context});
                    // TODO Handle syntax errors
                }
            }

            // Process contexts
            for (const context of contextsToProcess) {
                contextsToProcess.delete(context);
                const previousContexts = new Set([context]);

                {
                    // Reduction
                    let reductions = parseTable.reductions.get(context.symbol) || new Set();
                    for (const reduction of reductions) {
                        const firstContextOfReduction = findFirstContextOfReduction(context, reduction);
                        if (!firstContextOfReduction) {
                            // debug({reductionFailed: reduction});
                            continue;
                        }

                        // TODO Prendre en compte la stack pour filtrer les réductions possibles
                        const reducedContext = new Context();
                        reducedContext.code = code;
                        reducedContext.symbol = reduction;
                        reducedContext.offset = firstContextOfReduction.offset;
                        reducedContext.previousContext = firstContextOfReduction.previousContext;
                        debug({reduced: reducedContext});
                        contextsToProcess.add(reducedContext);
                        previousContexts.add(reducedContext);

                        if (reducedContext.previousContext === null && reducedContext.symbol === parseTable.topSymbol /* TODO Check the total matched length ? */) {
                            finalContexts.add(reducedContext);
                        }
                    }
                }

                {
                    // If the context is a terminal, find next terminal contexts to match
                    if (isTerminal(context)) {
                        for (const previousContext of previousContexts) {
                            const nextContexts = computeNextContexts(context, parseTable);
                            for (const c of nextContexts) {
                                c.previousContext = previousContext;
                                contextToMatch.add(c);
                                // debug({toMatch: c});
                            }
                        }
                    }
                }
            }
        }

        // TODO Choose the best final context.
        debug({finalContexts});
    };
}

module.exports = Parser;