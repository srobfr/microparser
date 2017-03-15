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

Node.prototype.text = function () {
    return this.children.map(function(child) {
        return (typeof child === "string" ? child : child.text());
    }).join("");
};

Node.prototype.remove = function () {
    if (this.next) this.next.prev = this.prev;
    if (this.prev) this.prev.next = this.next;
    if (this.parent) {
        let i = this.parent.children.indexOf(this);
        if (i >= 0) this.parent.children.splice(i, 1);
    }
};

Node.prototype.append = function (node) {
    node.remove();
    if (this.children.length > 0) {
        let prevNode = this.children[this.children.length - 1];
        prevNode.next = node;
        node.prev = prevNode;
    }
    node.parent = this;
    this.children.push(node);
};

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
};

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
};

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
};

Node.prototype.empty = function () {
    this.children = [];
    return this;
};

Node.prototype.findParent = function (query) {
    if (!this.parent) return null;
    if (this.parent.grammar === query) return this.parent;
    return this.parent.findParent(query);
};


Node.prototype.find = function (query) {
    let results = [];
    if (this.grammar === query) {
        results.push(this);
        return results; // Optimization
    }

    _.each(this.children, function (node) {
        if (_.isString(node)) return;
        results = results.concat(node.find(query));
    });

    return results;
};

Node.prototype.findOne = function (query) {
    if (this.grammar === query) return this;
    let result = null;
    _.each(this.children, function (node) {
        if (_.isString(node)) return;
        if (node.grammar === query) result = node;
        else result = node.findOne(query);
        if (result) return false;
    });

    return result;
};

Node.prototype.setCode = function (code) {
    // TODO injecter le parser dans chaque node

    const Parser = require(__dirname + "/Parser.js");
    const $newNode = Parser.parse(this.grammar, code);
    this.children = $newNode.children;
    return this;
};

module.exports = Node;
