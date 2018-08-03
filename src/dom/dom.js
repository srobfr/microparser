const debug = require('debug')('microparser:dom:parser');
const Parser = require('../Parser/Parser');
const Node = require('./Node');
const unscalarize = require('../utils/unscalarize');

// === Node extensions ===
require('./nodeExtensions/xml'); // Provides the xml() method
require('./nodeExtensions/search'); // Provide the various findBy... methods

let parser;
function defaultEvaluateFunction(context, children) {
    const node = new Node(context.originalGrammar, parser);
    node.children = children;
    let prevChild = null;
    for (const c of children) {
        if (typeof c !== 'string') continue;
        c.parent = node;
        if (prevChild) {
            prevChild.next = c;
            c.prev = prevChild;
        }
    }

    return node;
}

parser = new Parser({
    evaluate: defaultEvaluateFunction
});

function or(...grammars) {
    return {or: grammars};
}

function multiple(grammar, separator) {
    if (separator === undefined) return {multiple: grammar};

    const firstItem = grammar;
    const nextItem = [separator, grammar];
    nextItem.evaluate = (context, children) => children;
    const nextItems = or(
        // TODO
    );
    nextItems.evaluate = (context, children) => (children === '' ? );

    // There is a separator.
    const g = [grammar, nextItems];
    g.evaluate = function (context, children) {
        const node = new Node(grammar, parser);
    };

    return g;
}

function optmul(grammar, separator) {
    return helpers.optional(helpers.multiple(grammar, separator));
}

function optional(grammar) {
    return {or: [grammar, '']};
}

function tag(tag, grammar) {
    if (/boolean|number|string/.test(typeof grammar)) grammar = unscalarize(grammar).unscalarized;
    grammar.tag = tag;
    return grammar;
}

module.exports = {
    // Main marsing function
    parse: parser.parse,

    // Grammar helpers
    or, multiple, optmul, optional, tag
};

