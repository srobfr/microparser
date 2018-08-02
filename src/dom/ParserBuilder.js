const debug = require('debug')('microparser:dom:parser');
const Parser = require('../Parser/Parser');
const Node = require('./Node');

// Node extensions
// require('./nodeExtensions/indent');
// require('./nodeExtensions/insert');
// require('./nodeExtensions/removeWithSeparator');
require('./nodeExtensions/search');
require('./nodeExtensions/xml');

/**
 * Parser that produce a pseudo-dom.
 * @constructor
 */
function ParserBuilder() {
    const that = this;

    /**
     * Builds a pre-configured parser.
     *
     * @param options
     * @returns {Parser}
     */
    that.build = function (options) {
        let parser;
        options = Object.assign({
            evaluate: function (context, children) {
                // Node builder.
                const node = new Node(context.originalGrammar, parser);
                node.children = children;
                for (const c of children) if (typeof c !== 'string') c.parent = node;
                if (context.originalGrammar.decorate) context.originalGrammar.decorate(node);
                return node;
            }
        }, options || {});

        parser = new Parser(options);
        return parser;
    };
}

module.exports = ParserBuilder;