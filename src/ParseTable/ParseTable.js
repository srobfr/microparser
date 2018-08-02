/**
 * A parser table built from a grammar.
 * @constructor
 */
function ParseTable() {
    const that = this;

    /**
     * A map of possible symbols transitions (shift, reduce, or finish).
     * @type {Map<any, any>}
     */
    that.actions = new Map();

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

    /**
     * The map of original grammar objects, indexed by the unscalarized grammar node.
     * @type {null}
     */
    that.originalGrammarsMap = null;
}

module.exports = ParseTable;