var cheerio = require("cheerio");

var originalCheerioLoad = cheerio.load;
cheerio.load = function() {
    var $ = originalCheerioLoad.apply(this, arguments);

    // Inject the DOM in each elements.
    $.prototype.$ = $;

    /**
     * Returns an element xml code.
     * @return {string}
     */
    $.prototype.xml = function() {
        return $.xml(this);
    };

    /**
     * Elements creation from xml string, like $(html)
     * @return {$}
     */
    $.prototype.create = function() {
        return $.apply(undefined, arguments);
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

    return $;
};

module.exports = cheerio;
