const _ = require('lodash');
const ParseTable = require('./ParseTable');
const {treeAdd, treeHas} = require('../utils/tree');
const unscalarize = require('../utils/unscalarize');
const debug = require('debug')('ParseTableBuilder');
const util = require('util');

const inspect = obj => util.inspect(obj, {hidden: true, depth: 30, colors: true});


/**
 * ParseTable instances builder.
 * @constructor
 */
function ParseTableBuilder() {
    const that = this;

    function computeFirstAndLastTerminalsBySymbols(parentSymbol, grammar, firstsLastsBySymbol = new Map(), alreadyVisited = new Map()) {
        if (treeHas(alreadyVisited, parentSymbol, grammar)) return;
        // Mark as visited
        treeAdd(alreadyVisited, parentSymbol, grammar);
        if (!firstsLastsBySymbol.has(grammar)) firstsLastsBySymbol.set(grammar, {firsts: new Set(), lasts: new Set()});
        const firstsLasts = firstsLastsBySymbol.get(grammar);

        if (Array.isArray(grammar)) {
            // Sequence
            if (grammar.length) {
                // Visit each sub grammar
                for (const subGrammar of grammar) {
                    computeFirstAndLastTerminalsBySymbols(grammar, subGrammar, firstsLastsBySymbol, alreadyVisited);
                }

                // Set firsts & lasts
                for (const fg of firstsLastsBySymbol.get(_.first(grammar)).firsts) {
                    firstsLasts.firsts.add(fg);
                }

                for (const lg of firstsLastsBySymbol.get(_.last(grammar)).lasts) {
                    firstsLasts.lasts.add(lg);
                }
            }
        } else if (grammar.or) {
            // Or
            for (const subGrammar of grammar.or) {
                computeFirstAndLastTerminalsBySymbols(grammar, subGrammar, firstsLastsBySymbol, alreadyVisited);
            }

            // Set firsts & lasts
            for (const subGrammar of grammar.or) {
                for (const fg of firstsLastsBySymbol.get(subGrammar).firsts) {
                    firstsLasts.firsts.add(fg);
                }
                for (const lg of firstsLastsBySymbol.get(subGrammar).lasts) {
                    firstsLasts.lasts.add(lg);
                }
            }
        } else if (grammar.multiple) {
            // Multiple
            computeFirstAndLastTerminalsBySymbols(grammar, grammar.multiple, firstsLastsBySymbol, alreadyVisited);
            for (const fg of firstsLastsBySymbol.get(grammar.multiple).firsts) {
                firstsLasts.firsts.add(fg);
            }
            for (const lg of firstsLastsBySymbol.get(grammar.multiple).lasts) {
                firstsLasts.lasts.add(lg);
            }
        } else {
            // Leaf symbol
            firstsLasts.firsts.add(grammar);
            firstsLasts.lasts.add(grammar);
        }

        return firstsLastsBySymbol;
    }

    function computeActions(topSymbol, firstsLastsBySymbol) {
        const actions = new Map();

        function walk(grammar, visited) {
            visited = visited || new Set();

            if (visited.has(grammar)) return;
            visited.add(grammar);

            if (Array.isArray(grammar)) {
                // Sequence
                // Reductions
                if (grammar.length > 0) treeAdd(actions, _.last(grammar), {reduce: grammar});

                // Transitions
                let prev = null;
                for (const g of grammar) {
                    walk(g, visited);
                    const {firsts: subFirsts} = firstsLastsBySymbol.get(g) || {firsts: new Set(), lasts: new Set()};
                    if (prev) for (const f of subFirsts) {
                        treeAdd(actions, prev, {shift: f});
                    }
                    prev = g;
                }
            } else if (grammar.or) {
                // Or
                for (const g of grammar.or) {
                    walk(g, visited);
                    // Reductions
                    treeAdd(actions, g, {reduce: grammar});
                }
            } else if (grammar.multiple) {
                // Multiple
                const g = grammar.multiple;
                walk(g, visited);

                // Transitions
                const {firsts: subFirsts} = firstsLastsBySymbol.get(g) || {firsts: new Set(), lasts: new Set()};
                for (const f of subFirsts) {
                    treeAdd(actions, g, {shift: f});
                }

                // Reductions
                treeAdd(actions, g, {reduce: grammar});
            } else {
                // Terminal
            }
        }

        walk(topSymbol);
        treeAdd(actions, topSymbol, {finish: true});

        return actions;
    }

    /**
     * Builds a ParseTable instance from the given grammar.
     * @param grammar
     */
    that.build = function (grammar) {
        const {
            unscalarized: topSymbol,
            originalValuesMap: originalValuesMap
        } = unscalarize(grammar);

        // First, compute the first & last terminals of each symbol.
        const firstsLastsBySymbol = computeFirstAndLastTerminalsBySymbols(null, topSymbol);
        if (!firstsLastsBySymbol.get(topSymbol).firsts.size) {
            throw new Error("Wrong grammar (no first symbol)");
        }

        if (!firstsLastsBySymbol.get(topSymbol).lasts.size) {
            throw new Error("Wrong grammar (no terminal symbol)");
        }

        // Then, compute transitions & reductions
        const actions = computeActions(topSymbol, firstsLastsBySymbol);

        const parseTable = new ParseTable();
        parseTable.firstSymbols = Array.from(firstsLastsBySymbol.get(topSymbol).firsts);
        parseTable.topSymbol = topSymbol;
        parseTable.actions = actions;
        parseTable.originalGrammarsMap = originalValuesMap;
        parseTable.firstsLastsBySymbol = firstsLastsBySymbol;

        return parseTable;
    };
}

module.exports = ParseTableBuilder;
