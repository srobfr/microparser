const debug = require('debug')('microparser:helpers');
const Node = require('./Node.js');
const unscalarize = require('../utils/unscalarize');
const helpers = module.exports = {};

helpers.or = function (...grammars) {
    return {or: grammars};
};

helpers.multiple = function (grammar, separator) {
    if (separator === undefined) return {multiple: grammar};
    // There is a separator
    const g = [
        grammar,
        {
            or: [
                {multiple: [separator, grammar]},
                ''
            ]
        }
    ];
    g.evaluate = function (context, children) {
        const node = new Node(g, context.parser);
        // Squash the children structure
        node.children = [children[0]];
        const $or = children[1];
        if ($or.children[0] && $or.children[0].children) {
            for (const $item of $or.children[0].children) {
                if ($item.children) node.children.push(...$item.children);
            }
        }

        return node;
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

