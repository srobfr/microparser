const unscalarize = require('../utils/unscalarize');
const helpers = module.exports = {};

helpers.or = function (...grammars) {
    return {or: grammars};
};

helpers.multiple = function (grammar) {
    return {multiple: grammar};
};

helpers.optional = function (grammar) {
    return {or: [grammar, '']};
};

helpers.tag = function (tag, grammar) {
    if (/boolean|number|string/.test(typeof grammar)) grammar = unscalarize(grammar).unscalarized;
    grammar.tag = tag;
    return grammar;
};

