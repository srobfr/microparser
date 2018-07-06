const _ = require('lodash');
const ParseTable = require('./ParseTable');
const {treeAdd} = require('../utils/tree');
const unscalarize = require('../utils/unscalarize');

/**
 * ParseTable instances builder.
 * @constructor
 */
function ParseTableBuilder() {
    const that = this;

    function computeFirstAndLastTerminalsBySymbols(topSymbol) {
        const resolversBySymbol = new Map();
        const resolved = new Map();

        /**
         * Recursive tree walker
         * @param grammar
         * @param visited
         * @returns {any}
         */
        function setupResolvers(grammar, visited) {
            visited = visited || new Set();

            // Leafs-to-root walk
            if (visited.has(grammar)) return;
            visited.add(grammar);

            if (Array.isArray(grammar)) {
                // Sequence
                for (const g of grammar) {
                    setupResolvers(g, visited);
                }

                if (grammar.length > 0) {
                    const gf = _.first(grammar);
                    treeAdd(resolversBySymbol, gf, () => {
                        if (!resolved.has(grammar)) resolved.set(grammar, {firsts: new Set(), lasts: new Set()});
                        const r = resolved.get(grammar);
                        if (r.firsts !== resolved.get(gf).firsts) {
                            r.firsts = resolved.get(gf).firsts;
                            (resolversBySymbol.get(grammar) || []).forEach(resolver => resolver());
                        }
                    });
                    const gl = _.last(grammar);
                    treeAdd(resolversBySymbol, gl, () => {
                        if (!resolved.has(grammar)) resolved.set(grammar, {firsts: new Set(), lasts: new Set()});
                        const r = resolved.get(grammar);
                        if (r.lasts !== resolved.get(gl).lasts) {
                            r.lasts = resolved.get(gl).lasts;
                            (resolversBySymbol.get(grammar) || []).forEach(resolver => resolver());
                        }
                    });
                }
            } else if (grammar.or) {
                // Or
                for (const g of grammar.or) {
                    setupResolvers(g, visited);
                    treeAdd(resolversBySymbol, g, () => {
                        if (!resolved.has(grammar)) resolved.set(grammar, {firsts: new Set(), lasts: new Set()});
                        const gr = resolved.get(g);
                        const r = resolved.get(grammar);
                        const prevCount = r.firsts.size + r.lasts.size;
                        for (const gf of gr.firsts) r.firsts.add(gf);
                        for (const gl of gr.lasts) r.lasts.add(gl);
                        if (r.firsts.size + r.lasts.size !== prevCount) {
                            (resolversBySymbol.get(grammar) || []).forEach(resolver => resolver());
                        }
                    });
                }
            } else if (grammar.multiple) {
                // Multiple
                const g = grammar.multiple;
                setupResolvers(g, visited);
                treeAdd(resolversBySymbol, g, () => {
                    if (!resolved.has(grammar)) resolved.set(grammar, {firsts: new Set(), lasts: new Set()});
                    const gr = resolved.get(g);
                    const r = resolved.get(grammar);
                    const prevCount = r.firsts.size + r.lasts.size;
                    for (const gf of gr.firsts) r.firsts.add(gf);
                    for (const gl of gr.lasts) r.lasts.add(gl);
                    if (r.firsts.size + r.lasts.size !== prevCount) {
                        (resolversBySymbol.get(grammar) || []).forEach(resolver => resolver());
                    }
                });
            } else {
                treeAdd(resolversBySymbol, null, () => {
                    resolved.set(grammar, {firsts: new Set([grammar]), lasts: new Set([grammar])});
                    (resolversBySymbol.get(grammar) || []).forEach(resolver => resolver());
                });
            }
        }

        setupResolvers(topSymbol);
        // Here we have the leaf->root dependancies map.

        // Resolve the terminals
        (resolversBySymbol.get(null) || []).forEach(resolver => resolver());

        return resolved;
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
                    const {firsts: subFirsts, lasts: subLasts} = firstsLastsBySymbol.get(g) || {firsts: new Set(), lasts: new Set()};
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
                const {firsts: subFirsts, lasts: subLasts} = firstsLastsBySymbol.get(g) || {firsts: new Set(), lasts: new Set()};
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
        const topSymbol = unscalarize(grammar);

        // First, compute the first & last terminals of each symbol.
        const firstsLastsBySymbol = computeFirstAndLastTerminalsBySymbols(topSymbol);
        if (!firstsLastsBySymbol.has(topSymbol)) {
            // Buggy grammar. For example, it contains no terminal or an infinite recursion as first symbol.
            throw new Error("Wrong grammar (no reachable terminal symbol ?)");
        }

        // Then, compute transitions & reductions
        const actions = computeActions(topSymbol, firstsLastsBySymbol);

        const parseTable = new ParseTable();
        parseTable.firstSymbols = Array.from(firstsLastsBySymbol.get(topSymbol).firsts);
        parseTable.topSymbol = topSymbol;
        parseTable.actions = actions;

        return parseTable;
    };
}

module.exports = ParseTableBuilder;