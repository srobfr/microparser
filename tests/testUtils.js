const assert = require('assert');
const util = require('util');

module.exports = {};

function unifyInspectFormat(str) {
    return str.split(/\n */g).join('\n');
}

/**
 * Compares a util.inspect(obj) result to the given string.
 * @param obj
 * @param str
 */
module.exports.inspectEqual = function (str, obj) {
    assert.equal(unifyInspectFormat(str), unifyInspectFormat(util.inspect(obj, {hidden: true, depth: 30})));
};

