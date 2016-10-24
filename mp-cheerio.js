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
    this.each(function(undefined, node) {
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
    this.each(function(undefined, node) {
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

module.exports = $;
