const _ = require("lodash");
const Node = require(__dirname + "/../Node.js");

Node.prototype.getIndent = function () {
    let indent = "";
    let node = this;
    while (true) {
        node = node.parent;
        if (!node) break;
        if (node.grammar.indent) indent += node.grammar.indent;
    }

    return indent;
};
