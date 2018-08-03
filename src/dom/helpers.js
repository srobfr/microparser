const unscalarize = require('../utils/unscalarize');
const helpers = module.exports = {};

helpers.or = function (...grammars) {
    return {or: grammars};
};

helpers.multiple = function (grammar, separator) {
    if (separator === undefined) return {multiple: grammar};

    // There is a separator
    const g = [grammar, helpers.optmul([separator, grammar])];
    g.evaluate = function(context, children) {
        const node = new Node(grammar, parser);
    };

    return g;
};

helpers.optmul = function (grammar, separator) {
    return helpers.optional(helpers.multiple(grammar, separator));
};

helpers.optional = function (grammar) {
    return {or: [grammar, '']};
};

helpers.tag = function (tag, grammar) {
    if (/boolean|number|string/.test(typeof grammar)) grammar = unscalarize(grammar).unscalarized;
    grammar.tag = tag;
    return grammar;
};

