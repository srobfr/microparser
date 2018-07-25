const Node = require('../Node');

/**
 * Returns the theorical indentation string for the current node.
 * @returns {string}
 */
Node.prototype.getIndent = function () {
    let indent = '';
    let node = this;
    while (true) {
        node = node.parent;
        if (!node) break;
        if (node.grammar.indent) indent += node.grammar.indent;
    }

    return indent;
};
