let _ = require("lodash");

/**
 * Matches any of the specified nodes.
 * @param grammarA
 * @param grammarB
 * @return {{type: string, value: Array}}
 */
function or(grammarA, grammarB) {
    let args = _.toArray(arguments);
    if (args.length < 1) throw new Error("At least one argument should be given.");
    return {type: "or", value: args};
}

/**
 * Always matches. Go forward if subnode matches.
 * @param grammar
 * @return {{type, value}|{type: string, value: Array}}
 */
function optional(grammar) {
    if (arguments.length !== 1) throw new Error("Wrong arguments count.");
    return {type: "optional", value: grammar};
}

/**
 * Tries to match at least one time the subnode, optionally with a separator between each occurrence.
 * @param grammar
 * @param separator
 * @return {*}
 */
function multiple(grammar, separator) {
    if (arguments.length === 0 || arguments.length > 2) throw new Error("Wrong arguments count.");
    return {type: "multiple", value: grammar, separator: separator};
}

/**
 * Tries to match zero or more time the subnode, optionally with a separator between each occurrence.
 * @param grammar
 * @param separator
 * @return {*}
 */
function optmul(grammar, separator) {
    if (arguments.length === 0 || arguments.length > 2) throw new Error("Wrong arguments count.");
    return {type: "optmul", value: grammar, separator: separator};
}

/**
 * Matches only if the sub grammar does not match.
 * @param grammar
 * @return {*}
 */
function not(grammar) {
    if (arguments.length !== 1) throw new Error("Wrong arguments count.");
    return {type: "not", value: grammar};
}

module.exports = {multiple, not, optional, optmul, or};
