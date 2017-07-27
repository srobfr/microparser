const _ = require("lodash");

/**
 * Simple DOM-like data structure.
 * @constructor
 */
function Node() {
    Object.defineProperty(this, 'parent', {value: null, enumerable: false, configurable: true, writable: true});
    // this.parent = null;
    Object.defineProperty(this, 'prev', {value: null, enumerable: false, configurable: true, writable: true});
    // this.prev = null;
    Object.defineProperty(this, 'next', {value: null, enumerable: false, configurable: true, writable: true});
    // this.next = null;
    this.children = [];
}

Node.prototype.unlink = function () {
    if (this.next) this.next.prev = this.prev;
    if (this.prev) this.prev.next = this.next;
    if (this.parent) {
        let i = this.parent.children.indexOf(this);
        if (i >= 0) this.parent.children.splice(i, 1);
    }
    return this;
};

Node.prototype.remove = Node.prototype.unlink;

Node.prototype.append = function (node) {
    node.unlink();
    if (this.children.length > 0) {
        let prevNode = this.children[this.children.length - 1];
        prevNode.next = node;
        node.prev = prevNode;
    }
    node.parent = this;
    this.children.push(node);
    return this;
};

Node.prototype.prepend = function (node) {
    node.unlink();
    if (this.children.length > 0) {
        let nextNode = this.children[0];
        nextNode.prev = node;
        node.next = nextNode;
    }
    node.parent = this;
    this.children.unshift(node);
};

Node.prototype.before = function (node) {
    node.unlink();
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

Node.prototype.after = function (node) {
    node.unlink();
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

Node.prototype.replaceWith = function (node) {
    node.unlink();
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

Node.prototype.empty = function () {
    this.children = [];
    return this;
};

Node.prototype.text = function (text) {
    if (text === undefined) {
        // Reading
        return this.children.map(function (child) {
            return (typeof child === "string" ? child : child.text());
        }).join("");
    }

    if(!_.isString(text)) throw new Error(`Non-string value given to text() : ` + require("util").inspect(text));

    // Writing
    const that = this;
    const $newNode = that.parser.parse(this.grammar, text);
    this.children = $newNode.children;
    this.children.map((n) => n.parent = that);
    return this;
};

module.exports = Node;
