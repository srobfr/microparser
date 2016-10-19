/**
 * Context used by the parsing engine.
 * @param code
 * @param offset
 * @constructor
 */
function Context(code, offset) {
    var that = this;
    that.code = code;
    that.offset = offset;
}

module.exports = Context;
