/**
 * A parser table built from a grammar.
 * @constructor
 */
function ParseTable() {
    const that = this;

    /**
     * A map of possible symbols transitions.
     * @type {Map<any, any>}
     */
    that.transitions = new Map();

    /**
     * A map of possible symbols reductions.
     * @type {Map<any, any>}
     */
    that.reductions = new Map();

    /**
     * The list of possible initial symbols.
     * @type {Array}
     */
    that.firstSymbols = [];

    /**
     * The symbol representing the top grammar node.
     * @type {Object}
     */
    that.topSymbol = null;
}

module.exports = ParseTable;