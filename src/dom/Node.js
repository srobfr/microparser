/**
 * Represents a DOM node
 * @param grammar
 * @param parser
 * @constructor
 */
function Node(grammar, parser) {
    const that = this;

    /**
     * The original grammar for this node.
     */
    that.grammar = grammar;

    /**
     * The parser that created this node.
     */
    that.parser = parser;

    /**
     * The node parent in the dom.
     * @type {Node}
     */
    that.parent = null;

    /**
     * The children of this node (either strings or Nodes)
     *
     * @type {Array<Node|string>}
     */
    that.children = [];

    /**
     * Returns an xml representation of this node's code. The 'tag' property must be set on the subnodes' grammars
     * @returns {string}
     */
    that.xml = function() {
        const childrenXml = that.children.map(c => c.xml ? c.xml() : c).join('');
        return that.grammar.tag
            ? `<${that.grammar.tag}>${childrenXml}</${that.grammar.tag}>`
            : childrenXml;
    };

    /**
     * Gets or sets this node's text.
     * @returns {string}
     */
    that.text = function(text) {
        if (text === undefined) return that.children.map(c => c.text ? c.text() : c).join('');
        // TODO Setter

    };
}

module.exports = Node;
