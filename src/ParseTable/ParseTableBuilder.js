const _ = require('lodash');
const debug = require('debug')('microparser:parseTableBuilder');
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
                return r;
            }

            if (value.or) {
                const r = {or: []};
                visited.set(value, r);
                value.or.forEach(v => r.or.push(us(v)));
                return r;
            }

            return value;
        }

        return us(value);
    }

    function addToMap(map, ...args) {
        let m = map;
        for (let i = 0, l = args.length; i < l; i++) {
            const a = args[i];
            const nm = m.get(a) || (i === l - 1 ? true : new Map());
            m.set(a, nm);
            m = nm;
        }
    }

    /**
     * Builds a ParseTable instance from the given grammar.
     * @param grammar
     */
    that.build = function (grammar) {
        debug("Building ParseTable from :", grammar);

        const transitions = new Map();
        const reductions = new Map();
        const visited = new Map();
        const resolved = new Map();

        /**
         * Recursive tree walker
         * @param grammar
         * @returns {any}
         */
        function walk(grammar) {
            {
                // Optimization : skip already resolved symbols.
                let r = resolved.get(grammar);
                if (r) {
                    debug({cached: grammar, r});
                    return r;
                }
            }

            const r = {
                firsts: new Set(),
                lasts: new Set(),
            };
            visited.set(grammar, r);

            if (Array.isArray(grammar)) {
                // Sequence
                if (grammar.length === 0) throw new Error("Empty sequence");

                {// First, try to define firsts and lasts terminals for this sequence.
                    for (const g of grammar) {
                        const {firsts: subFirsts} = visited.get(g) || walk(g);
                        if (subFirsts.size > 0) {
                            r.firsts = subFirsts;
                            break;
                        }
                    }

                    for (let i = grammar.length - 1; i >= 0; i--) {
                        const g = grammar[i];
                        const {lasts: subLasts} = visited.get(g) || walk(g);
                        if (subLasts.size > 0) {
                            r.lasts = subLasts;
                            break;
                        }
                    }
                }

                // Then, walk every sub nodes
                const firstsLasts = [];
                for (const g of grammar) {
                    firstsLasts.push(visited.get(g) || walk(g));
                }

                // Handle transitions
                let prevSubLasts = [];
                for (const firstLast of firstsLasts) {
                    const {firsts: subFirsts, lasts: subLasts} = firstLast;
                    for (const prevSubLast of prevSubLasts) {
                        for (const subFirst of subFirsts) {
                            debug("Transition", {from: prevSubLast, to: subFirst});
                            addToMap(transitions, prevSubLast, subFirst);
                        }
                    }

                    prevSubLasts = subLasts;
                }

                // Sequence reduction
                if (grammar.length > 0) addToMap(reductions, _.last(grammar), grammar);
            } else if (grammar.or) {
                // Or
                r.firsts = new Set();
                r.lasts = new Set();
                for (const g of grammar.or) {
                    const firstsLasts = visited.get(g) || walk(g);
                    const {firsts, lasts} = firstsLasts;
                    for (const f of firsts) r.firsts.add(f);
                    for (const l of lasts) r.lasts.add(l);

                    // Reduction
                    addToMap(reductions, g, grammar);
                }
            } else {
                // Terminal symbol
                r.firsts = new Set([grammar]);
                r.lasts = new Set([grammar]);
            }

            resolved.set(grammar, r);
            return r;
        }

        const topSymbol = unscalarize(grammar);
        const {firsts} = walk(topSymbol);

        const parseTable = new ParseTable();
        parseTable.firstSymbols = Array.from(firsts);
        parseTable.topSymbol = topSymbol;
        parseTable.transitions = transitions;
        parseTable.reductions = reductions;

        return parseTable;
    };
}

module.exports = ParseTableBuilder;