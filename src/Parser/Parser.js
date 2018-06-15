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
     * Throws a syntax error based on the expected symbols & offset
     * @param code
     * @param expectedOffset
     * @param expected
     */
    function throwSyntaxError(code, expectedOffset, expected) {
        expected = Array.from(expected).map(s => s && s.valueOf ? s.valueOf() : s);

        debug({code, bestOffset: expectedOffset, expected});
        let lines = code.split("\n");
        let o = 0;
        lines.forEach(function (line, i) {
            let l = line.length;
            if (o + i <= expectedOffset && expectedOffset <= o + i + l) {
                let lineOffset = expectedOffset - (o + i) + 1;
                let spaces = new Array(lineOffset).join(" ");

                let expectedStr = (
                    expected.length
                        ? "expected " + expected.map(function (expected) {
                        if (expected === null) return "EOF";
                        if (expected.type === "not") return "not(" + require("util").inspect(expected.value, {colors: false}) + ")";
                        return require("util").inspect(expected, {colors: false});
                    }).join(" or ")
                        : "Grammar error."
                );

                let message = `Syntax error on line ${i + 1}, column ${lineOffset}:\n${line}\n${spaces}^ ${expectedStr}`;
                throw new Error(message);
            }
            o += l;
        });
    }

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
    function reduceContext(context, reduction) {
        let c = context;
        const matchedCodes = [];
        let firstContext = context;
        let evaluate;
        if (Array.isArray(reduction)) {
            const subContexts = [];
            for (let i = reduction.length - 1; i >= 0; i--) {
                if (!c || c.symbol !== reduction[i]) {
                    // debug({subReductionFailed: reduction[i], c});
                    return null;
                }
                subContexts.unshift(c);
                matchedCodes.unshift(c.matchedCode);
                firstContext = c;
                c = c.previousContext;
            }

            evaluate = () => {
                if (context.symbol.tag) return `<${reduction.tag}>${subContexts.map(context => context.evaluate()).join('')}</${reduction.tag}>`;
                return subContexts.map(context => context.evaluate()); // TODO
            };
        } else {
            matchedCodes.push(c.matchedCode);
            evaluate = () => {
                if (reduction.tag) return `<${reduction.tag}>${context.evaluate()}</${reduction.tag}>`;
                return context.evaluate(); // TODO
            };
        }

        if (firstContext === null) return null;

        const reducedContext = new Context();
        reducedContext.code = context.code;
        reducedContext.symbol = reduction;
        reducedContext.matchedCode = matchedCodes.join('');
        reducedContext.offset = firstContext.offset;
        reducedContext.previousContext = firstContext.previousContext;
        reducedContext.evaluate = evaluate;

        return reducedContext;
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

        let expected = new Set();
        let expectedOffset = 0;

        function onFail(context) {
            if (expectedOffset < context.offset) {
                expectedOffset = context.offset;
                expected = new Set([context.symbol]);
            } else if (expectedOffset === context.offset) {
                expected.add(context.symbol);
            }
        }

        // Initialize first contexts
        let contextsToMatch = new Set(parseTable.firstSymbols.map(symbol => {
            const context = new Context();
            context.symbol = symbol;
            context.code = code;
            return context;
        }));

        let contextsToReduce = new Set();
        const finalContexts = new Set();

        while (contextsToMatch.size > 0 || contextsToReduce.size > 0) {
            debug({toMatch: contextsToMatch.size});

            // Match terminal contexts
            for (const context of contextsToMatch) {
                matchContext(context);
                if (context.matchedCode !== null) {
                    // The context matched the code.
                    contextsToReduce.add(context);
                    context.evaluate = () => {
                        if (context.symbol.tag) return `<${context.symbol.tag}>${context.matchedCode}</${context.symbol.tag}>`;
                        return context.matchedCode; // TODO
                    };
                    debug({matched: context.evaluate()});
                } else {
                    // The context dit not match the code.
                    onFail(context);
                    // debug({matchFailed: context});
                }
            }

            contextsToMatch = new Set();

            debug({toReduce: contextsToReduce.size});

            // Process contexts
            for (const context of contextsToReduce) {
                const previousContexts = new Set([context]);

                {
                    // Reduction
                    let reductions = parseTable.reductions.get(context.symbol) || new Set();
                    for (const reduction of reductions) {
                        const reducedContext = reduceContext(context, reduction);
                        if (!reducedContext) continue;

                        debug({reduced: reducedContext.evaluate()});
                        contextsToReduce.add(reducedContext);
                        previousContexts.add(reducedContext);

                        if (reducedContext.previousContext === null && reducedContext.symbol === parseTable.topSymbol) {
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
                                contextsToMatch.add(c);
                            }
                        }
                    }
                }
            }
        }

        // Filter final contexts
        for (const context of finalContexts) {
            if (context.matchedCode.length < code.length) {
                // There is remaining code.
                const eofContext = new Context();
                eofContext.code = context.code;
                eofContext.offset = context.matchedCode.length;
                eofContext.symbol = null; // EOF
                eofContext.previousContext = context;
                onFail(eofContext);
                finalContexts.delete(context);
                continue;
            }

            // TODO Choisir le meilleur contexte
            const evaluation = context.evaluate();
            debug({evaluation});
        }

        // debug({finalContexts, expected: expected, expectedOffset: expectedOffset});
        if (finalContexts.size === 0) throwSyntaxError(code, expectedOffset, expected);

        // return finalContext.evaluate();
    };
}

module.exports = Parser;