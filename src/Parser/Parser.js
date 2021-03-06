const Context = require('./Context');
const ParseTableBuilder = require('../ParseTable/ParseTableBuilder');
const {treeAdd, treeHas} = require('../utils/tree');
const debug = require('debug')('microparser:Parser');
const util = require('util');
const chalk = require('chalk');

/**
 * The Parser
 * @constructor
 */
function Parser(options) {
    const that = this;
    const parseTableBuilder = new ParseTableBuilder();

    const inspect = obj => util.inspect(obj, {hidden: true, depth: 30, colors: true});

    options = Object.assign({
        evaluate: (context, subContextsEvaluations) => subContextsEvaluations,
    }, options || {});

    /**
     * Throws a syntax error based on the expected symbols & offset
     * @param code
     * @param expectedOffset
     * @param expected
     */
    function throwSyntaxError(code, expectedOffset, expected) {
        expected = Array.from(expected).map(s => s && s.valueOf ? s.valueOf() : s);

        // if (debug.enabled) debug({code, bestOffset: expectedOffset, expected});
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
        else if (context.symbol instanceof RegExp) {
            const m = code.match(symbol);
            context.matchedCode = (m && m[0]);
        } else if (context.symbol instanceof Function) {
            context.matchedCode = context.symbol(context) || null;
        }

        if (context.matchedCode !== null) {
            context.evaluate = () => {
                return (context.symbol.evaluate || options.evaluate)(context, [context.matchedCode]);
            };

            if (debug.enabled) debug(`${showCode(context.code, context.offset, context.matchedCode.length)} ${chalk.green.inverse('matches')} ${inspect(context.symbol)}`);
            return true;
        }

        if (debug.enabled) debug(`${showCode(context.code, context.offset, 1)} ${chalk.red.inverse('does not match')} ${inspect(context.symbol)}`);

        return false;
    }

    const showCode = (code, offset, length) => {
        const prefixLength = Math.min(6, offset);
        const prefixOffset = offset - prefixLength;

        return [
            code.substr(prefixOffset, prefixLength),
            (length === 0 ? '‸' : ''),
            chalk.underline(code.substr(offset, length)),
            code.substr(offset + length, 6)
        ].join('');
    };

    /**
     * @param context
     * @param reduction
     * @param originalGrammarsMap
     * @param getTag {function}
     * @returns {Context|null}
     */
    function reduceContext(context, reduction, originalGrammarsMap, getTag) {
        let c = context;
        const matchedCodes = [];
        let firstContext = context;
        const reducedContext = new Context();
        let evaluate;
        if (Array.isArray(reduction)) {
            // Sequence
            const subContexts = [];
            for (let i = reduction.length - 1; i >= 0; i--) {
                if (!c || c.symbol !== reduction[i]) {
                    // debug({subReductionFailed: reduction[i], c});
                    firstContext = null;
                    break;
                }
                subContexts.unshift(c);
                matchedCodes.unshift(c.matchedCode);
                firstContext = c;
                c = c.previousContext;
            }

            evaluate = () => {
                const subContextsEvaluations = subContexts.map(context => context.evaluate());
                return (reduction.evaluate || options.evaluate)(reducedContext, subContextsEvaluations);
            };
        } else if (reduction.or) {
            // Or
            matchedCodes.push(c.matchedCode);
            evaluate = () => {
                return (reduction.evaluate || options.evaluate)(reducedContext, [context.evaluate()]);
            };
        } else if (reduction.multiple) {
            // Multiple
            const subContexts = [];
            do {
                subContexts.unshift(c);
                matchedCodes.unshift(c.matchedCode);
                firstContext = c;
                c = c.previousContext;
            } while (c && c.symbol === reduction.multiple);

            evaluate = () => {
                const subContextsEvaluations = subContexts.map(context => context.evaluate());
                return (reduction.evaluate || options.evaluate)(reducedContext, subContextsEvaluations);
            };
        }

        if (firstContext === null) {
            if (debug.enabled) debug(`${showCode(context.code, context.offset, matchedCodes.join('').length)} ${chalk.red.inverse('is not a')} ${chalk.blue.inverse(getTag(reduction))}`);
            return null;
        }

        reducedContext.code = context.code;
        reducedContext.symbol = reduction;
        reducedContext.originalGrammar = originalGrammarsMap.get(reducedContext.symbol);
        reducedContext.matchedCode = matchedCodes.join('');
        reducedContext.offset = firstContext.offset;
        reducedContext.previousContext = firstContext.previousContext;
        reducedContext.evaluate = evaluate;

        if (debug.enabled) debug(`${showCode(reducedContext.code, reducedContext.offset, reducedContext.matchedCode.length)} ${chalk.green.inverse('is a')} ${chalk.blue.inverse(getTag(reducedContext.symbol))}`);

        return reducedContext;
    }

    /**
     * Removes competing contexts (same offset, symbol & matchedCode) by keeping the first.
     *
     * @param contexts
     */
    function dedupContextsSet(contexts) {
        const dedupTree = new Map();
        for (const context of contexts) {
            if (treeHas(dedupTree, context.offset, context.symbol, context.matchedCode)) {
                contexts.delete(context);
            } else treeAdd(dedupTree, context.offset, context.symbol, context.matchedCode);
        }
    }

    /**
     * Parses the given code using the given grammar.
     *
     * @param grammar
     * @param code
     */
    that.parse = function (grammar, code) {
        const stats = {
            steps: 1,
            shifts: 0,
            reductions: 0,
            maxContexts: 0,
        };

        let now = Date.now();
        const parseTable = parseTableBuilder.build(grammar);
        // console.log(require('util').inspect(parseTable.actions, {colors: true, depth: 10}));
        stats.parseTableBuildTimeMs = Date.now() - now;
        const originalGrammarsMap = parseTable.originalGrammarsMap;

        const generatedTags = new Map();
        const getTag = symbol => {
            if (!generatedTags.has(symbol)) {
                const tag = `${symbol.tag || 'sym'}${generatedTags.size}`;
                // debug(`Registering untagged symbol ${inspect(symbol)} as ${chalk.blue.inverse(tag)}`);
                generatedTags.set(symbol, tag);
            }
            return generatedTags.get(symbol);
        };

        let expected = new Set();
        let expectedOffset = 0;

        function onFail(context) {
            // if (debug.enabled) debug({failed: context.symbol, offset: context.offset});
            if (expectedOffset < context.offset) {
                expectedOffset = context.offset;
                expected = new Set([context.symbol]);
            } else if (expectedOffset === context.offset) {
                expected.add(context.symbol);
            }
        }

        now = Date.now();

        if (debug.enabled) debug(`=== Step ${stats.steps}===`);
        // Initialize first contexts
        let contexts = new Set(parseTable.firstSymbols.map(symbol => {
            const context = new Context();
            context.symbol = symbol;
            context.originalGrammar = originalGrammarsMap.get(context.symbol);
            context.code = code;
            return context;
        }).filter(context => {
            let r = matchContext(context);
            if (r) {
                // if (debug.enabled) debug('Initial shift', inspect(context));
            } else onFail(context);
            return r;
        }));

        const finalContexts = new Set();

        while (contexts.size > 0) {
            stats.steps++;
            stats.maxContexts = Math.max(stats.maxContexts, contexts.size);
            if (debug.enabled) debug(`=== Step ${stats.steps} (${contexts.size} contexts) ===`);

            let newContexts = new Set();
            for (const context of contexts) {
                // Get possible actions
                const actions = parseTable.actions.get(context.symbol);

                // Here we produce a new context for each possible action
                for (const action of actions) {
                    if (action.shift) {
                        const newContext = new Context();
                        newContext.code = context.code;
                        newContext.offset = context.offset + (context.matchedCode.length);
                        newContext.previousContext = context;
                        newContext.symbol = action.shift;
                        newContext.originalGrammar = originalGrammarsMap.get(newContext.symbol);
                        // if (debug.enabled) debug(`- Trying ${inspect(action)} on "${newContext.code.substr(newContext.offset, 10)}".`);
                        if (!matchContext(newContext)) {
                            onFail(newContext);
                            continue;
                        }

                        newContexts.add(newContext);
                        // if (debug.enabled) debug('Shifted', inspect(newContext));
                        stats.shifts++;
                    } else if (action.reduce) {
                        // if (debug.enabled) debug(`- Trying ${inspect(action)} on "${context.code.substr(context.offset, 10)}".`);
                        const newContext = reduceContext(context, action.reduce, originalGrammarsMap, getTag);
                        if (!newContext) continue;
                        newContexts.add(newContext);
                        // if (debug.enabled) debug('Reduced', inspect(newContext));
                        stats.reductions++;
                    } else if (action.finish && context.previousContext === null) {
                        // if (debug.enabled) debug(`- Trying ${inspect(action)} on "${context.code.substr(context.offset, 10)}".`);
                        if (context.matchedCode !== context.code) {
                            // Too much code to match this grammar.
                            const eofContext = new Context();
                            eofContext.code = context.code;
                            eofContext.offset = context.matchedCode.length;
                            eofContext.symbol = null; // EOF
                            eofContext.previousContext = context;
                            onFail(eofContext);
                            continue;
                        }

                        finalContexts.add(context);
                        // if (debug.enabled) debug('Finished', inspect(context));
                    }
                }
            }

            // Optimization : Shave the contexts tree by removing useless duplicates
            dedupContextsSet(newContexts);

            // if (debug.enabled) debug('newContexts', inspect(newContexts));

            // debug({before: contexts.size, after: newContexts.size});
            contexts = newContexts;
        }

        stats.parsingTimeMs = Date.now() - now;

        const statsDebug = require('debug')('microparser:stats');
        statsDebug(`Parser stats`, stats);

        if (finalContexts.size === 0) throwSyntaxError(code, expectedOffset, expected);

        // Use first final context.
        const finalContext = finalContexts.values().next().value;
        return finalContext.evaluate();
    };
}

module.exports = Parser;
