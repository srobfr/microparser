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

    var id = 0;
    function expandGrammar(grammar) {
        if ((/boolean|number|string/).test(typeof grammar)) {
            var node = {};
            node.type = typeof grammar;
            node.value = grammar;
            node.first = function() { return [node]; };
            node.last = function() { return [node]; };
            node.id = id++;
            return node;

        } else if (grammar instanceof RegExp) {
            var node = {};
            node.type = "regex";
            node.value = grammar;
            node.first = function() { return [node]; };
            node.last = function() { return [node]; };
            node.id = id++;
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
                node.id = id++;

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
                node.id = id++;
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

    function connect(befores, grammar, afters, knownNodesForGrammar) {
        function getOrCreateNode(grammar) {
            return {
                grammar: grammar,
                next: []
            };

            var node = knownNodesForGrammar.get(grammar);
            if(!node) {
                node = {
                    grammar: grammar,
                    next: []
                };

                knownNodesForGrammar.set(grammar, node);
            }

            return node;
        }

        if (grammar.type === "sequence") {
            // Entrée
            var firstsOfFirstGrammar = _.first(grammar.value).first();
            _.each(firstsOfFirstGrammar, function(f) {
                var node = getOrCreateNode(f);
                _.each(befores, function(b) {
                    b.next.push(node);
                });
            });

            // Interne
            for(var i = 0; i < (grammar.value.length - 1); i++) {
                var leftGrammarLasts = grammar.value[i].last();
                var rightGrammarFirsts = grammar.value[i+1].first();
                _.each(leftGrammarLasts, function(leftGrammar) {
                    _.each(rightGrammarFirsts, function(rightGrammar) {
                        // On connecte left à right.
                        var leftNode = getOrCreateNode(leftGrammar);
                        var rightNode = getOrCreateNode(rightGrammar);
                        leftNode.next.push(rightNode);
                    });
                });
            }

            // Sortie
            var lastsOfLastGrammar = _.last(grammar.value).last();
            _.each(afters, function(a) {
                _.each(lastsOfLastGrammar, function(l) {
                    var node = getOrCreateNode(l);
                    _.each(afters, function(a) {
                        node.next.push(a);
                    });
                });
            });

        } else if (grammar.type === "or") {
            _.each(grammar.value, function(subGrammar) {
                connect(befores, subGrammar, afters, new Map());
            });

        } else {
            var node = getOrCreateNode(grammar);
            _.each(afters, function(a) {
                node.next.push(a);
            });
            _.each(befores, function(b) {
                b.next.push(node);
            });
        }
    }

    // Start est le noeud d'entrée.
    var start = {
        type: "start",
        last: function() { return [start]; }
    };

    var node = {
        grammar: start,
        next: []
    };

    var knownNodesForGrammar = new Map();
    knownNodesForGrammar.set(start, node);
    connect([node], expandedGrammar, [], knownNodesForGrammar);

    //
    //// On nettoie les noeuds
    //_.each(relations, function(item) {
    //    delete(item[1].first);
    //    delete(item[1].last);
    //});
    //
    //// TODO On reconstruit un arbre d'enchaînements possibles des noeuds.

    //console.log("node=", util.inspect(node, {
    //    colors: true,
    //    depth: 10
    //}));

    return node;
}

// ---

var select = /^select/i;
var space = /^[\s\t\r\n]+/;
var optionnalSpace = {type: "or", value: [space, ""]};

var sqlQuery = [
    select, optionnalSpace,
    "test", optionnalSpace
];

var grammar = sqlQuery;
var baz = ["BAZ"];
grammar = ["FOO", "BAR", baz, "blah", baz];

// -----------

console.log("grammar=", util.inspect(grammar, {
    colors: true,
    depth: 10
}));

var result = processGrammar(grammar);
console.log("result=", util.inspect(result, {
    colors: true,
    depth: 10
}));

// Affichage du déroulement
function dumpResult(next, indent) {
    if(indent.length > 30) return;
    _.each(next, function(node) {
        console.log(indent, indent.length, util.inspect(node.grammar.value, {
            colors: true,
            depth: 10
        }));
        dumpResult(node.next, indent + "  ");
    });
}

dumpResult(result.next, "");