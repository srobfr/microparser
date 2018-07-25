const _ = require("lodash");
const Node = require(__dirname + "/../Node.js");

{
    // Search by tags

    Node.prototype.findDirectByTag = function (tag) {
        return _.filter(this.children, (n => n.grammar && n.grammar.tag === tag));
    };

    Node.prototype.findOneDirectByTag = function (tag) {
        return _.find(this.children, (n => n.grammar && n.grammar.tag === tag));
    };

    Node.prototype.findByTag = function (tag) {
        const r = [];
        _.each(this.children, n => {
            if (_.isString(n)) return;
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

            r = n.findOneByTag(tag);
            if (r) return false;
        });

        return r;
    };
}

{
    // Search by grammar

    Node.prototype.findDirectByGrammar = function (grammar) {
        return _.filter(this.children, (n => n.grammar === grammar));
    };

    Node.prototype.findOneDirectByGrammar = function (grammar) {
        return _.find(this.children, (n => n.grammar === grammar));
    };

    Node.prototype.findByGrammar = function (grammar) {
        const r = [];
        _.each(this.children, n => {
            if (_.isString(n)) return;
            if (n.grammar === grammar) r.push(n);
            r.push(n.findByGrammar(grammar));
        });
        return _.flattenDeep(r);
    };

    Node.prototype.findOneByGrammar = function (grammar) {
        let r = null;
        _.each(this.children, n => {
            if (!n.grammar) return;
            if (n.grammar === grammar) {
                r = n;
                return false;
            }

            r = n.findOneByGrammar(grammar);
            if (r) return false;
        });

        return r;
    };

    Node.prototype.findParentByGrammar = function (grammar) {
        let node = this;
        do {
            node = node.parent;
        } while (node && node.grammar !== grammar);
        return node || null;
    };
}

{
    // Search by predicates

    Node.prototype.findDirectByPredicate = function (predicate) {
        return _.filter(this.children, (n => !_.isString(n) && predicate(n)));
    };

    Node.prototype.findOneDirectByPredicate = function (predicate) {
        return _.find(this.children, (n => !_.isString(n) && predicate(n)));
    };

    Node.prototype.findByPredicate = function (predicate) {
        const r = [];
        _.each(this.children, n => {
            if (_.isString(n)) return;
            if (predicate(n)) r.push(n);
            r.push(n.findByPredicate(predicate));
        });
        return _.flattenDeep(r);
    };

    Node.prototype.findOneByPredicate = function (predicate) {
        let r = null;
        _.each(this.children, n => {
            if (_.isString(n)) return;
            if (predicate(n)) {
                r = n;
                return false;
            }

            r = n.findOneByPredicate(predicate);
            if (r) return false;
        });
        return r;
    };
}