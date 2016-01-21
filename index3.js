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
            //node.first = function() { return [node]; };
            //node.last = function() { return [node]; };
            //node.id = id++;
            return node;

        } else if (grammar instanceof RegExp) {
            var node = {};
            node.type = "regex";
            node.value = grammar;
            //node.first = function() { return [node]; };
            //node.last = function() { return [node]; };
            //node.id = id++;
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

                //node.first = function() {
                //    return _.first(node.value).first();
                //};
                //node.last = function() {
                //    return _.last(node.value).last();
                //};
                //node.id = id++;

            } else if (grammar.type && grammar.value) {
                node = {type: grammar.type};
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = _.map(grammar.value, expandGrammar);

                //node.first = function() {
                //    var r = [];
                //    _.each(node.value, function(node) {
                //        r = r.concat(node.first());
                //    });
                //    return r;
                //};
                //node.last = function() {
                //    var r = [];
                //    _.each(node.value, function(node) {
                //        r = r.concat(node.last());
                //    });
                //    return r;
                //};
                //node.id = id++;
            }

            return node;
        }
    }


    var expandedGrammar = expandGrammar(grammar);

    console.log("expandedGrammar=", util.inspect(expandedGrammar, {
        colors: true,
        depth: 10
    }));

    function walk(grammar, antiLoopMap) {
        if (grammar.type === "sequence") {
            var node = antiLoopMap.get(grammar);
            if (node) {
                // On est dans une boucle => on retourne la référence qu'on a déjà.
                return node;
            }

            // On initialise le noeud correspondant à (cette grammaire dans ce contexte).
            node = {
                grammar: grammar,
                firsts: null,
                lasts: [],
                nexts: []
            };

            antiLoopMap = cloneMap(antiLoopMap);
            antiLoopMap.set(grammar, node);

            var currentNodes = [node];
            _.each(grammar.value, function(subGrammar) {
                var subNode = walk(subGrammar, antiLoopMap);
                node.firsts = node.firsts || subNode.firsts;
                node.lasts = subNode.lasts;
                _.each(currentNodes, function(currentNode) {
                    currentNode.nexts = currentNode.nexts.concat(subNode.firsts);
                });
                currentNodes = subNode.lasts;
            });
            node.lasts = currentNodes;

            return node;

        } else if (grammar.type === "or") {
            var node = antiLoopMap.get(grammar);
            if (node) {
                // On est dans une boucle => on retourne la référence qu'on a déjà.
                return node;
            }

            // On initialise le noeud correspondant à (cette grammaire dans ce contexte).
            node = {
                grammar: grammar,
                firsts: [],
                lasts: [],
                nexts: []
            };

            antiLoopMap = cloneMap(antiLoopMap);
            antiLoopMap.set(grammar, node);

            _.each(grammar.value, function(subGrammar) {
                var subNode = walk(subGrammar, antiLoopMap);
                node.firsts = node.firsts.concat(subNode.firsts);
                node.lasts = node.lasts.concat(subNode.lasts);
                node.nexts = node.nexts.concat(subNode.firsts);
            });

            return node;

        } else {
            var node = {
                grammar: grammar,
                nexts: []
            };

            node.firsts = [node];
            node.lasts = [node];

            return node;
        }
    }

    var node = walk(expandedGrammar, new Map());
    return node;
}

function cloneMap(map) {
    var newMap = new Map();
    _.each(map.store, function(item) {
        newMap.store.push(item);
    });
    return newMap;
}

function or() {
    return {type: "or", value: _.toArray(arguments)};
}

function optional(node) {
    return or(node, "");
}

function multiple(node) {
    var s = [node];
    var o = optional(s);
    s.push(o); // Référence croisée.
    return s;
}


// Affichage du déroulement
function dumpResult(next, indent) {
    if(indent.length > 50) {
        console.log(indent, "***!! Loop !!***");
        return;
    }

    _.each(next, function(node) {
        console.log(indent, indent.length, util.inspect(node.grammar.value, {
            colors: true,
            depth: 10
        }));
        dumpResult(node.nexts, indent + " ");
    });
}

// ---
var b = ["B"];
b.push("A", b, "C");
var grammar = [
    b
];

// -----------
//console.log = function() {};
console.log("grammar=", util.inspect(grammar, {
    colors: true,
    depth: 10
}));

var result = processGrammar(grammar);
//console.log("result=", util.inspect(result, {
//    colors: true,
//    depth: 99
//}));
console.log("====");
dumpResult(result.nexts, "");