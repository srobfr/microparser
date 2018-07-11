/**
 * Represents a context in the parsing operation.
 * @constructor
 */
function Context() {
    const that = this;

    /**
     * The full code to parse.
     * @type {string}
     */
    that.code;

    /**
     * The code snippet matched at this context (or null if not matched)
     * @type {string|null}
     */
    that.matchedCode = null;

    /**
     * The character offset in the code.
     * @type {number}
     */
    that.offset = 0;

    /**
     * The previous context.
     * @type {Context|null}
     */
    // that.previousContext = null;
    Object.defineProperty(that, 'previousContext', {value: null, enumerable: false, writable: true}); // TODO Dev

    /**
     * The symbol.
     * @type {any}
     */
    that.symbol;

    /**
     * The original grammar.
     * @type {any}
     */
    that.originalGrammar;

    /**
     * The evaluation callback.
     * @type {Function}
     */
    // that.evaluate;
    Object.defineProperty(that, 'evaluate', {value: null, enumerable: false, writable: true}); // TODO Dev
}

module.exports = Context;