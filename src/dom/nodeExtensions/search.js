const _ = require("lodash");
const Node = require('../Node');
const Selection = require('../Selection');

{
    // Search by tags

    Node.prototype.findDirectByTag = function (tag) {
        return new Selection(_.filter(this.children, (n => n.grammar && n.grammar.tag === tag)));
    };

    Node.prototype.findOneDirectByTag = function (tag) {
        return new Selection(_.find(this.children, (n => n.grammar && n.grammar.tag === tag)));
    };

    Node.prototype.findByTag = function (tag) {
        const r = [];
        _.each(this.children, n => {
            if (_.isString(n)) return;
            if (n.grammar.tag === tag) r.push(n);
            r.push(...n.findByTag(tag).nodes);
        });
        return new Selection(r);
    };

    Node.prototype.findOneByTag = function (tag) {
        let r = null;
        _.each(this.children, n => {
            if (!n.grammar) return;
            if (n.grammar.tag === tag) {
                r = n;
                return false;
            }

            r = n.findOneByTag(tag).nodes;
            if (r) return false;
        });

        return new Selection(r);
    };
}

{
    // Search by grammar
    Node.prototype.findDirectByGrammar = function (grammar) {
        return new Selection(_.filter(this.children, (n => n.grammar === grammar)));
    };

    Node.prototype.findOneDirectByGrammar = function (grammar) {
        return new Selection(_.find(this.children, (n => n.grammar === grammar)));
    };

    Node.prototype.findByGrammar = function (grammar) {
        const r = [];
        _.each(this.children, n => {
            if (_.isString(n)) return;
            if (n.grammar === grammar) r.push(n);
            r.push(...n.findByGrammar(grammar).nodes);
        });
        return new Selection(r);
    };

    Node.prototype.findOneByGrammar = function (grammar) {
        let r = null;
        _.each(this.children, n => {
            if (!n.grammar) return;
            if (n.grammar === grammar) {
                r = n;
                return false;
            }

            r = n.findOneByGrammar(grammar).nodes;
            if (r) return false;
        });

        return new Selection(r);
    };

    Node.prototype.findParentByGrammar = function (grammar) {
        let node = this;
        do {
            node = node.parent;
        } while (node && node.grammar !== grammar);
        return new Selection(node ? [node] : []);
    };
}

{
    // Search by predicates

    Node.prototype.findDirectByPredicate = function (predicate) {
        return new Selection(_.filter(this.children, (n => !_.isString(n) && predicate(n))));
    };

    Node.prototype.findOneDirectByPredicate = function (predicate) {
        return new Selection(_.find(this.children, (n => !_.isString(n) && predicate(n))));
    };

    Node.prototype.findByPredicate = function (predicate) {
        const r = [];
        _.each(this.children, n => {
            if (_.isString(n)) return;
            if (predicate(n)) r.push(n);
            r.push(...n.findByPredicate(predicate).nodes);
        });
        return new Selection(r);
    };

    Node.prototype.findOneByPredicate = function (predicate) {
        let r = null;
        _.each(this.children, n => {
            if (_.isString(n)) return;
            if (predicate(n)) {
                r = n;
                return false;
            }

            r = n.findOneByPredicate(predicate).nodes;
            if (r) return false;
        });
        return new Selection(r);
    };
}