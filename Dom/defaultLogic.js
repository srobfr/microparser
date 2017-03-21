const _ = require("lodash");

function getNodeOrderValue(node, orderItem) {
    if (_.isFunction(orderItem)) return orderItem(node);
    return (node.findOne(orderItem) ? 1 : 0);
}

function compareNodesOrders(node1, node2, order) {
    let r = 0;
    for (let i in order) {
        const v1 = getNodeOrderValue(node1, order[i]);
        const v2 = getNodeOrderValue(node2, order[i]);

        if (_.isString(v1)) r = v2.localeCompare(v1);
        else r = v1 - v2;
        if (r !== 0) break;
    }
    return r;
}

function getDefaultCodeFromGrammar(grammar) {
    if (grammar.default !== undefined) return grammar.default;
    if (_.isString(grammar)) return grammar;
    if (_.isArray(grammar)) return grammar.map((subGrammar) => getDefaultCodeFromGrammar(subGrammar)).join("");
    throw new Error("No default code found for grammar : " + require("util").inspect(grammar, {depth: 30}));
}

function multipleAdd(nodeOrCode, nextNode) {
    const that = this;

    // Get the node to insert
    const node = (_.isString(nodeOrCode) ? that.parser.parse(that.grammar.value, nodeOrCode) : nodeOrCode);

    // Finding the insertion position
    if (nextNode === undefined && that.grammar.order) {
        // On trouve le premier noeud qui devrait se trouver après celui à insérer.
        nextNode = _.find(that.children, (child) => {
            if (that.grammar.separator && child.grammar === that.grammar.separator) return false; // Skip separators
            return compareNodesOrders(node, child, that.grammar.order) > 0;
        });
    }

    // Get the separator (or null if not needed)
    const separator = (that.children.length > 0 && that.grammar.separator !== undefined
            ? that.parser.parse(that.grammar.separator, getDefaultCodeFromGrammar(that.grammar.separator))
            : null
    );

    // Insertion
    if (nextNode) {
        // Insert just before nextNode
        nextNode.before(node);
        if (separator) nextNode.before(separator);
    } else {
        // Insert in last position
        if (separator) that.append(separator);
        that.append(node);
    }
}

function multipleRemove(node) {
    const that = this;
    if (that.children.length <= 1) throw new Error("Cannot delete node as the parent would be empty");
    return optmulRemove.call(that, node);
}

function optmulRemove(node) {
    const that = this;

    // We must find the direct child containing the given node.
    while (node.parent && node.parent !== that) node = node.parent;
    if (node.parent !== that) throw new Error("Cannot remove this node as it is not contained in the current node");

    if (that.grammar.separator) {
        // Handling separators
        if (node.prev) node.prev.unlink();
        else if (node.next) node.next.unlink();
    }

    node.unlink();
    return that;
}

function decorator(node) {
    if (node.grammar.type === "multiple") {
        node.add = multipleAdd; // handles order & separators
        node.remove = multipleRemove; // handles separators
    }
    if (node.grammar.type === "optmul") {
        node.add = multipleAdd; // handles order & separators
        node.remove = optmulRemove; // handles separators
    }
}

module.exports = {
    decorator: decorator,
    getDefaultCodeFromGrammar: getDefaultCodeFromGrammar
};
