const _ = require("lodash");
const Node = require(__dirname + "/../Node.js");

Node.prototype.removeWithSeparator = function () {
    if (this.parent
        && (this.parent.grammar.type === "optmul"
        || this.parent.grammar.type === "multiple")
        && this.parent.grammar.separator !== undefined) {

        if(this.prev) {
            // There is a previous node.
            this.prev.remove();
        } else if (this.next) {
            // There is a next node.
            this.next.remove();
        }
    }

    return this.remove();
};