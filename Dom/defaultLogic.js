const _ = require("lodash");
const Node = require(__dirname + "/Node.js");

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

function getDefaultCodeFromGrammar(grammar, parentNode) {
    if (grammar.default !== undefined) {
        if (_.isFunction(grammar.default)) return grammar.default(parentNode);
        return grammar.default;
    }

    if (_.isString(grammar)) return grammar;
    if (_.isArray(grammar)) return _.map(grammar, (subGrammar, i) => {
        return getDefaultCodeFromGrammar(subGrammar, parentNode)
    }).join("");
    if (grammar.type === "multiple") return getDefaultCodeFromGrammar(grammar.value, parentNode);
    if (grammar.type === "optional" || grammar.type === "optmul") return "";
    throw new Error("No default code found for grammar : " + require("util").inspect(grammar, {depth: 30}));
}

function multipleAdd(nodeOrCode, nextNode) {
    const that = this;

    // Get the node to insert
    const node = (nodeOrCode instanceof Node ? nodeOrCode : that.parser.parse(that.grammar.value, nodeOrCode));

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
            ? that.parser.parse(that.grammar.separator, getDefaultCodeFromGrammar(that.grammar.separator, that))
            : null
    );

    // Insertion
    if (nextNode) {
        // Insert just before nextNode
        nextNode.before(node);
        if (separator) {
            nextNode.before(separator);
            if (_.isFunction(separator.fix)) separator.fix();
        }
    } else {
        // Insert in last position
        if (separator) that.append(separator);
        that.append(node);
        if (separator && _.isFunction(separator.fix)) separator.fix();
    }

    return node;
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

function optionalGetOrCreateChild(code) {
    if (!this.children.length) this.text(_.isString(code) ? code : getDefaultCodeFromGrammar(this.grammar.value, this));
    return _.first(this.children);
}

function getIndent() {
    let indent = "";
    let n = this;
    while (n) {
        if (n.grammar.indent !== undefined) indent = n.grammar.indent + indent;
        n = n.parent;
    }
    return indent;
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

    if (node.grammar.type === "optional") {
        node.getOrCreateChild = optionalGetOrCreateChild;
    }

    node.getIndent = getIndent;
}

module.exports = {
    decorator: decorator,
    getDefaultCodeFromGrammar: getDefaultCodeFromGrammar
};
