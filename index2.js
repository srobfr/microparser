var _ = require("underscore");
var util = require("util");

/**
 * Implémentation d'une Map
 * @constructor
 */
function Map() {
    var that = this;
    that.store = [];
    that.get = function(key) {
        var r = _.find(that.store, function(item) {
            return (item[0] === key);
        });

        return r ? r[1] : undefined;
    };
    that.set = function(key, value) {
        that.store.push([key, value]);
    };
    that.each = function(func) {
        _.each(that.store, function(v, k) {
            func(v, k);
        });
    };
}

function processGrammar(grammar) {
    // On transforme la grammaire en arbre traversable récursivement et sans valeur scalaire.
    var alreadySeenGrammarNodesMap = new Map();

    function expandGrammar(grammar) {
        if ((/boolean|number|string/).test(typeof grammar)) {
            var node = {
                type: typeof grammar,
                value: grammar
            };

            node.first = function() { return [node]; };
            node.last = function() { return [node]; };

            return node;

        } else if (grammar instanceof RegExp) {
            var node = {
                type: "regex",
                value: grammar
            };

            node.first = function() { return [node]; };
            node.last = function() { return [node]; };

            return node;

        } else {
            var node = alreadySeenGrammarNodesMap.get(grammar);
            if (node) return node;

            if (Array.isArray(grammar)) {
                node = {type: "sequence"};
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = [];
                _.each(grammar, function(g) {
                    node.value.push(expandGrammar(g));
                });

                node.first = function() {
                    return _.first(node.value).first();
                };
                node.last = function() {
                    return _.last(node.value).last();
                };

            } else if (grammar.type && grammar.value) {
                node = {type: grammar.type};
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = _.map(grammar.value, expandGrammar);
                
                node.first = function() {
                    var r = [];
                    _.each(node.value, function(node) {
                        r = r.concat(node.first());
                    });
                    return r;
                };
                node.last = function() {
                    var r = [];
                    _.each(node.value, function(node) {
                        r = r.concat(node.last());
                    });
                    return r;
                };
            }

            return node;
        }
    }


    var expandedGrammar = expandGrammar(grammar);

    console.log("expandedGrammar=", util.inspect(expandedGrammar, {
        colors: true,
        depth: 10
    }));

    // A partir de la grammaire étendue, on va générer un graphe connecté des possiblités de noeuds suivant un noeud donné.
    _.each(alreadySeenGrammarNodesMap.store, function(item) {
        var grammar = item[1];
        if (grammar.type === "sequence") {
            grammar.first = function() {
                return _.first(grammar.value).first();
            };
            grammar.last = function() {
                return grammar.value[0].last();
            };
        } else if (grammar.type === "or") {
            grammar.first = function() {
                var r = [];
                _.each(grammar.value, function(node) {
                    r = r.concat(node.first());
                });
                return r;
            };
            grammar.last = function() {
                var r = [];
                _.each(grammar.value, function(node) {
                    r = r.concat(node.last());
                });
                return r;
            };
        } else {
            grammar.first = function() {
                return [grammar];
            };
            grammar.last = function() {
                return [grammar];
            };
        }
    });

    function connect(befores, node, afters) {
        var relations = [];

        if (node.type === "sequence") {
            // Entrée
            var firstsOfFirst = _.first(node.value).first();
            _.each(befores, function(b) {
                _.each(firstsOfFirst, function(f) {
                    relations.push([b, f]);
                });
            });

            // Interne
            for(var i = 0; i < (node.value.length - 1); i++) {
                var node1Last = node.value[i].last();
                var node2First = node.value[i+1].first();
                _.each(node1Last, function(n1) {
                    _.each(node2First, function(n2) {
                        relations.push([n1, n2]);
                    });
                });
            }

            // Sortie
            var lastsOfLast = _.last(node.value).last();
            _.each(afters, function(a) {
                _.each(lastsOfLast, function(l) {
                    relations.push([l, a]);
                });
            });

        } else if (node.type === "or") {
            _.each(node.value, function(node) {
                relations = relations.concat(connect(befores, node, afters));
            });

        } else {
            _.each(befores, function(b) {
                relations.push([b, node]);
            });
            _.each(afters, function(a) {
                relations.push([node, a]);
            });
        }

        return relations;
    }

    // Start est le noeud d'entrée.
    var start = {
        type: "start",
        last: function() { return [start]; }
    };

    var relations = connect([start], expandedGrammar, []);

    // On nettoie les noeuds
    _.each(relations, function(item) {
        delete(item[1].first);
        delete(item[1].last);
    });

    console.log("relations=", util.inspect(relations, {
        colors: true,
        depth: 10
    }));
}

// ---
var infiniteSequence = ["Infinite sequence"];
infiniteSequence.push(infiniteSequence);

var foo = ["B"];
var aOrB = { type: "or", value: [ foo, "A" ]};
foo.push(aOrB);
var grammar = ["AAA", aOrB, "CCC", [/^DDD/]];

// -----------

console.log("grammar=", util.inspect(grammar, {
    colors: true,
    depth: 10
}));

processGrammar(grammar);
