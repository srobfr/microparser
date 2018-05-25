const _ = require('lodash');
const ParseTable = require('./ParseTable');

/**
 * ParseTable instances builder.
 * @constructor
 */
function ParseTableBuilder() {
    const that = this;

    /**
     * Recursively convert scalar values into new Object instances.
     * @param value
     * @returns {{Object}}
     */
    function unscalarize(value) {
        const visited = new Map();

        function us(value) {
            if (value === null) return {null: true};
            if (typeof value === 'string') return new String(value);
            if (typeof value === 'number') return new Number(value);
            if (typeof value === 'boolean') return new Boolean(value);

            const alreadyVisited = visited.get(value);
            if (alreadyVisited) return alreadyVisited;

            if (Array.isArray(value)) {
                const r = [];
                visited.set(value, r);
                value.forEach(v => r.push(us(v)));
                if (value.length === 0) r.push(us(''));
                return r;
            }

            if (value.or) {
                const r = {or: []};
                visited.set(value, r);
                value.or.forEach(v => r.or.push(us(v)));
                if (value.or.length === 0) r.or.push(us(''));
                return r;
            }

            return value;
        }

        return us(value);
    }

    function addToTree(tree, ...args) {
        let t = tree;
        for (let i = 0, l = args.length; i < l; i++) {
            const a = args[i];
            if (i === (l - 1)) {
                // Here t should be a Set
                t.add(a);
            } else {
                // t is a Map
                const nt = t.get(a) || (i === l - 2 ? new Set() : new Map());
                t.set(a, nt);
                t = nt;
            }
        }
    }

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
                    addToTree(resolversBySymbol, gf, () => {
                        if (!resolved.has(grammar)) resolved.set(grammar, {firsts: new Set(), lasts: new Set()});
                        const r = resolved.get(grammar);
                        if (r.firsts !== resolved.get(gf).firsts) {
                            r.firsts = resolved.get(gf).firsts;
                            (resolversBySymbol.get(grammar) || []).forEach(resolver => resolver());
                        }
                    });
                    const gl = _.last(grammar);
                    addToTree(resolversBySymbol, gl, () => {
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
                    addToTree(resolversBySymbol, g, () => {
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
            } else {
                addToTree(resolversBySymbol, null, () => {
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

    function computeTransitionsAndReductions(topSymbol, firstsLastsBySymbol) {
        const transitions = new Map();
        const reductions = new Map();

        function walk(grammar, visited) {
            visited = visited || new Set();

            if (visited.has(grammar)) return;
            visited.add(grammar);

            if (Array.isArray(grammar)) {
                // Sequence
                let prevLasts = new Set();
                for (const g of grammar) {
                    walk(g, visited);
                    const {firsts: subFirsts, lasts: subLasts} = firstsLastsBySymbol.get(g) || {firsts: new Set(), lasts: new Set()};
                    for (const l of prevLasts) {
                        for (const f of subFirsts) {
                            // Transitions
                            addToTree(transitions, l, f);
                        }
                    }
                    prevLasts = subLasts;
                }

                // Reductions
                if (grammar.length > 0) addToTree(reductions, _.last(grammar), grammar);
            } else if (grammar.or) {
                // Or
                for (const g of grammar.or) {
                    walk(g, visited);
                    // Reductions
                    addToTree(reductions, g, grammar);
                }
            } else {
                // Terminal
            }
        }

        walk(topSymbol);

        return {transitions, reductions};
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
        const {transitions, reductions} = computeTransitionsAndReductions(topSymbol, firstsLastsBySymbol);

        const parseTable = new ParseTable();
        parseTable.firstSymbols = Array.from(firstsLastsBySymbol.get(topSymbol).firsts);
        parseTable.topSymbol = topSymbol;
        parseTable.transitions = transitions;
        parseTable.reductions = reductions;

        return parseTable;
    };
}

module.exports = ParseTableBuilder;