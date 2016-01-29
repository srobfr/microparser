var _ = require("lodash");
var Map = require(__dirname + "/Map.js");

var grammarChainer = {};
module.exports = grammarChainer;

grammarChainer.chain = function(grammar) {
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

            for(var i in grammar.value) {
                var subGrammar = grammar.value[i];
                var subNode = _walk(subGrammar, antiLoopMap);
                node.firsts = node.firsts || subNode.firsts;
                node.lasts = subNode.lasts;

                _.each(currentNodes, function(currentNode) {
                    if(currentNode.nexts.length > 0) return;
                    currentNode.nexts = currentNode.nexts.concat(subNode.firsts);
                });

                currentNodes = subNode.lasts;
            }

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
    var firsts = chainedNode.firsts;

    // Ensuite on parcours récursivement les noeuds pour supprimer les champs de travail ("firsts" & "lasts")
    function _clean(node) {
        if (node.firsts === undefined) return;
        delete node.firsts;
        delete node.lasts;
        _.each(node.nexts, _clean);
    }

    _clean(chainedNode);

    return firsts;
};
