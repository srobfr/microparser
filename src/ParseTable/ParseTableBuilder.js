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
        for(let i = 0, l = args.length; i < l; i++) {
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
    that.build = function(grammar) {
        debug("Building ParseTable from :", grammar);

        const transitions = new Map();
        const reductions = new Map();
        const visitsCounts = new Map();
        const resolved = new Map();

        /**
         * Recursive tree walker
         * @param grammar
         * @returns {any}
         */
        function walk(grammar) {
            debug({walking: grammar});

            {
                let r = resolved.get(grammar);
                if (r) {
                    debug({cached: grammar, r});
                    return r;
                }
            }

            const r = {};

            // Recursive symbol handling
            const visitsCount = (visitsCounts.get(grammar) || 0) + 1;
            visitsCounts.set(grammar, visitsCount);

            if (Array.isArray(grammar)) {
                // Sequence
                const firstsLasts = [];
                for(const g of grammar) {
                    if (visitsCount > 2) continue; // Recursive case
                    firstsLasts.push(walk(g));
                }

                r.firsts = [];
                let prevSubLasts = [];
                for (const firstLast of firstsLasts) {
                    // if (!firstLast) continue;
                    const {firsts: subFirsts, lasts: subLasts} = firstLast;
                    if (r.firsts.length === 0) r.firsts = subFirsts;

                    for (const prevSubLast of prevSubLasts) {
                        for (const subFirst of subFirsts) {
                            debug("Transition", {from: prevSubLast, to: subFirst});
                            addToMap(transitions, prevSubLast, subFirst);
                        }
                    }

                    prevSubLasts = subLasts;
                }

                r.lasts = prevSubLasts;

                // Sequence reduction
                if (grammar.length > 0) addToMap(reductions, _.last(grammar), grammar);
            } else if (grammar.or) {
                // Or
                r.firsts = [];
                r.lasts = [];
                for (const g of grammar.or) {
                    if (visitsCount > 2) continue;
                    const firstsLasts = walk(g);
                    const {firsts, lasts} = firstsLasts;
                    r.firsts.push.apply(r.firsts, firsts);
                    r.lasts.push.apply(r.lasts, lasts);

                    // Reduction
                    addToMap(reductions, g, grammar);
                }
            } else {
                // Terminal symbol
                r.firsts = [grammar];
                r.lasts = [grammar];

            }

            r.firsts = _.uniq(r.firsts);
            r.lasts = _.uniq(r.lasts);

            if (visitsCount === 1) resolved.set(grammar, r);
            debug({walked: grammar, r});
            return r;
        }

        const topSymbol = unscalarize(grammar);
        const {firsts} = walk(topSymbol);

        const parseTable = new ParseTable();
        parseTable.firstSymbols = firsts;
        parseTable.topSymbol = topSymbol;
        parseTable.transitions = transitions;
        parseTable.reductions = reductions;

        return parseTable;
    };
}

module.exports = ParseTableBuilder;