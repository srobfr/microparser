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
     * Convert scalar values into new Object instances.
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
        const visited = new Map();

        /**
         * Recursive tree walker
         * @param grammar
         * @returns {any}
         */
        function walk(grammar) {
            const v = visited.get(grammar);
            if (v) return v;
            const r = {};
            visited.set(grammar, r);

            if (Array.isArray(grammar)) {
                // Sequence
                let prevLasts = null;

                if (grammar.length > 0) {
                    // This allows recursive grammar
                    const {lasts} = walk(_.last(grammar));
                    r.lasts = lasts;
                }

                for (const g of grammar) {
                    const {firsts, lasts} = walk(g);
                    if (!r.firsts) r.firsts = firsts;

                    // Intermediate transitions
                    if (prevLasts) prevLasts.forEach(p => {
                        firsts.forEach(f => addToMap(transitions, p, f));
                    });

                    prevLasts = lasts;
                }

                // Sequence reduction
                if (grammar.length > 0) addToMap(reductions, grammar[grammar.length - 1], grammar);
            } else if (grammar.or) {
                // Or
                r.firsts = [];
                r.lasts = [];
                for (const g of grammar.or) {
                    const {firsts, lasts} = walk(g);
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