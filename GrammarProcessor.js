var _ = require("lodash");
var util = require("util");
var Map = require(__dirname + "/Map.js");

var GrammarProcessor = {};

GrammarProcessor.expandGrammar = function(grammar) {
    var alreadySeenGrammarNodesMap = new Map();

    function _expand(grammar) {
        if ((/boolean|number|string/).test(typeof grammar)) {
            var node = {};
            node.type = typeof grammar;
            node.value = grammar;
            return node;

        } else if (grammar instanceof RegExp) {
            var node = {};
            node.type = "regex";
            node.value = grammar;
            return node;

        } else {
            var node = alreadySeenGrammarNodesMap.get(grammar);
            if (node) return node;

            if (Array.isArray(grammar)) {
                node = {type: "sequence"};
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = [];
                _.each(grammar, function(g) {
                    node.value.push(_expand(g));
                });

            } else if (grammar.type === "or" && grammar.value) {
                node = {type: grammar.type};
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = _.map(grammar.value, _expand);

            } else if (grammar.type && grammar.value) {
                node = grammar;
                alreadySeenGrammarNodesMap.set(grammar, node);

            } else {
                throw new Error("Unrecognized grammar format : " + util.inspect(grammar));
            }

            return node;
        }
    }

    return _expand(grammar);
};

GrammarProcessor.computeNodesChaining = function(grammar) {
    function _walk(grammar, antiLoopMap) {
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

            antiLoopMap = antiLoopMap.clone();
            antiLoopMap.set(grammar, node);

            var currentNodes = [node];
            _.each(grammar.value, function(subGrammar) {
                var subNode = _walk(subGrammar, antiLoopMap);
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

            antiLoopMap = antiLoopMap.clone();
            antiLoopMap.set(grammar, node);

            _.each(grammar.value, function(subGrammar) {
                var subNode = _walk(subGrammar, antiLoopMap);
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

    var chainedNode = _walk(grammar, new Map());

    // Ensuite on parcours récursivement les noeuds pour supprimer les champs de travail ("firsts" & "lasts")
    function _clean(node) {
        if (node.firsts === undefined) return;
        delete node.firsts;
        delete node.lasts;
        _.each(node.nexts, _clean);
    }

    _clean(chainedNode);

    return chainedNode;
};

GrammarProcessor.process = function(grammar) {
    var expandedGrammar = GrammarProcessor.expandGrammar(grammar);
    return GrammarProcessor.computeNodesChaining(expandedGrammar);
};

module.exports = GrammarProcessor;