const _ = require("lodash");
const Node = require('../Node');

function getNodeOrderValue(node, orderItem) {
    // The order item is a predicate
    if (typeof orderItem === 'function') return orderItem(node);
    // The order item is a grammar
    return (node.findOneByGrammar(orderItem) ? 1 : 0);
}

function compareNodesOrders($node1, $node2, order) {
    let r = 0;
    for (const o of order) {
        const v1 = getNodeOrderValue($node1, o);
        const v2 = getNodeOrderValue($node2, o);

        if (typeof v1 === 'string') r = v2.localeCompare(v1);
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