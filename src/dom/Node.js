const debug = require('debug')('microparser:Node');

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
    Object.defineProperty(this, 'parent', {value: null, enumerable: false, configurable: true, writable: true});
    // this.parent = null;

    /**
     * The previous node sibling.
     * @type {Node}
     */
    Object.defineProperty(this, 'prev', {value: null, enumerable: false, configurable: true, writable: true});
    // this.prev = null;

    /**
     * The next node sibling.
     * @type {Node}
     */
    Object.defineProperty(this, 'next', {value: null, enumerable: false, configurable: true, writable: true});
    // this.next = null;

    /**
     * The children of this node (either strings or Nodes)
     *
     * @type {Array<Node|string>}
     */
    that.children = [];
}

/**
 * Removes the node from the DOM.
 * @returns {Node}
 */
Node.prototype.remove = function () {
    if (this.next) this.next.prev = this.prev;
    if (this.prev) this.prev.next = this.next;
    if (this.parent) {
        let i = this.parent.children.indexOf(this);
        if (i >= 0) this.parent.children.splice(i, 1);
    }
    return this;
};

/**
 * Appends a node into another.
 * @param node
 * @returns {Node}
 */
Node.prototype.append = function (node) {
    node.remove();
    if (this.children.length > 0) {
        let prevNode = this.children[this.children.length - 1];
        prevNode.next = node;
        node.prev = prevNode;
    }
    node.parent = this;
    this.children.push(node);
    return this;
};

/**
 * Prepends a node into another.
 * @param node
 */
Node.prototype.prepend = function (node) {
    node.remove();
    if (this.children.length > 0) {
        let nextNode = this.children[0];
        nextNode.prev = node;
        node.next = nextNode;
    }
    node.parent = this;
    this.children.unshift(node);
};

/**
 * Inserts the given node before the current node.
 * @param node
 * @returns {Node}
 */
Node.prototype.before = function (node) {
    node.remove();
    node.prev = this.prev;
    node.next = this;
    node.parent = this.parent;
    if (this.prev) this.prev.next = node;
    this.prev = node;
    if (this.parent) {
        let i = this.parent.children.indexOf(this);
        if (i >= 0) this.parent.children.splice(i, 0, node);
    }
    return this;
};

/**
 * Inserts the given node after the current node.
 * @param node
 * @returns {Node}
 */
Node.prototype.after = function (node) {
    node.remove();
    node.prev = this;
    node.next = this.next;
    node.parent = this.parent;
    if (node.next) node.next.prev = node;
    this.next = node;
    if (this.parent) {
        let i = this.parent.children.indexOf(this);
        if (i >= 0) this.parent.children.splice(i + 1, 0, node);
    }
    return this;
};

/**
 * Replaces the current node by the given node.
 * @param node
 * @returns {Node}
 */
Node.prototype.replaceWith = function (node) {
    node.remove();
    node.prev = this.prev;
    node.next = this.next;
    node.parent = this.parent;
    if (node.next) node.next.prev = node;
    if (node.prev) node.prev.next = node;
    if (this.parent) {
        let i = this.parent.children.indexOf(this);
        if (i >= 0) this.parent.children[i] = node;
    }
    return this;
};

/**
 * Empties the node.
 * @returns {Node}
 */
Node.prototype.empty = function () {
    this.children = [];
    return this;
};

/**
 * Get or set the node's textual content.
 * @param text
 * @returns {*}
 */
Node.prototype.text = function (text) {
    if (text === undefined) return this.children.map(c => (typeof c === 'string' ? c : c.text())).join('');
    if (typeof text !== 'string') throw new Error(`Non-string value given to text() : ` + require("util").inspect(text));

    const $newNode = this.parser.parse(this.grammar, text);
    this.children = $newNode.children;
    for (const c of this.children) c.parent = this;
    return this;
};

module.exports = Node;
