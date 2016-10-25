var _ = require("lodash");
var cheerio = require("cheerio");

// New cheerio instance with mp-specific options.
var $ = cheerio.load("", {xmlMode: true});

/**
 * Returns the node XML code. Useful for caching & debugging.
 * @return {string}
 */
$.prototype.xml = function() {
    return $.xml(this);
};

/**
 * Removes the text preceding the node.
 */
$.prototype.removePreviousText = function() {
    this.each(function(ignored, node) {
        var n = node.prev;
        var nodes = [];
        while (n && n.type === "text") {
            nodes.push(n);
            n = n.prev;
        }

        $(nodes).remove();
    });
    return this;
};

/**
 * Removes the text following the node.
 */
$.prototype.removeNextText = function() {
    this.each(function(ignored, node) {
        var n = node.next;
        var nodes = [];
        while (n && n.type === "text") {
            nodes.push(n);
            n = n.next;
        }

        $(nodes).remove();
    });
    return this;
};

function indentDomNode(node, indentation) {
    if (node.type === "text") {
        node.data = node.data.replace(/(\r)?\n(?!\r?\n)/g, "$1\n" + indentation);
    } else if (node.nodeType === 1) {
        _.each(node.childNodes, function (subNode) {
            indentDomNode(subNode, indentation);
        });
    }
}

/**
 * Indents the node content.
 */
$.prototype.indent = function(indentation) {
    this.each(function(ignored, node) {
        indentDomNode(node, indentation)
    });
    return this;
};

module.exports = $;
