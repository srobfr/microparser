const debug = require('debug')('microparser:dom:parser');
const Parser = require('../Parser/Parser');
const Node = require('./Node');

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
                const node = new Node(context.symbol, parser);
                node.children = children;
                for (const c of children) if (typeof c !== 'string') c.parent = node;

                return node;
            }
        }, options || {});

        parser = new Parser(options);
        return parser;
    };
}

module.exports = ParserBuilder;