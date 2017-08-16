const _ = require("lodash");
const Node = require(__dirname + "/../Node.js");

function getNodeOrderValue(node, orderItem) {
    // The order item is a predicate
    if (_.isFunction(orderItem)) return orderItem(node);
    // The order item is a grammar
    return (node.findOneByGrammar(orderItem) ? 1 : 0);
}

function compareNodesOrders($node1, $node2, order) {
    let r = 0;
    for (let i in order) {
        const v1 = getNodeOrderValue($node1, order[i]);
        const v2 = getNodeOrderValue($node2, order[i]);

        if (_.isString(v1)) r = v2.localeCompare(v1);
        else r = v1 - v2;

        if (r !== 0) break;
    }
    return r;
}

Node.prototype.insert = function ($node, $previousNode) {
    // First node.
    if (this.children.length === 0) return this.append($node);

    const self = this;
    if ($previousNode === undefined && this.grammar.order) {
        $previousNode = _.findLast(this.children, child =>
            child.grammar !== this.grammar.separator &&
            compareNodesOrders($node, child, self.grammar.order) < 0
        );
    }

    // Build separator
    let $separator = null;
    if (this.grammar.separator) $separator = this.parser.parse(this.grammar.separator);

    if (!$previousNode) {
        // Insert in first position.
        this.prepend($node);
        if ($separator) $node.after($separator);
    } else {
        // Insert the new node after $previousNode.
        $previousNode.after($node);
        if ($separator) $previousNode.after($separator);
    }

    return this;
};