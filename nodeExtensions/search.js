const _ = require("lodash");
const Node = require(__dirname + "/../Node.js");

Node.prototype.findDirectByTag = function (tag) {
    return _.filter(this.children, (n => n.grammar && n.grammar.tag === tag));
};

Node.prototype.findOneDirectByTag = function (tag) {
    return _.find(this.children, (n => n.grammar && n.grammar.tag === tag));
};

Node.prototype.findByTag = function (tag) {
    const r = [];
    _.each(this.children, n => {
        if (!n.grammar) return;
        if (n.grammar.tag === tag) r.push(n);
        r.push(n.findByTag(tag));
    });

    return _.flattenDeep(r);
};

Node.prototype.findOneByTag = function (tag) {
    let r = null;
    _.each(this.children, n => {
        if (!n.grammar) return;
        if (n.grammar.tag === tag) {
            r = n;
            return false;
        }

        r = n.findByTag(tag);
        if (r) return false;
    });

    return r;
};