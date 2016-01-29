var util = require("util");
var _ = require("lodash");
var Map = require(__dirname + "/Map.js");

var microparser = {};

/**
 * Représente un noeud de grammaire, qui matche une chaîne.
 * @param value
 * @constructor
 */
microparser.grammar = {};
microparser.grammar.String = function(value) {
    var that = this;
    that.value = value;
    that.firsts = [that];
    that.lasts = [that];
    that.match = function(context) {
        var match = new microparser.parser.Match(context, that);
        match.matchedLength = that.value.length;
        match.match = (context.code.substr(context.offset, match.matchedLength) === that.value);
        return match;
    };

    that.result = function(result) {
        result.push(that.value);
    };

    /**
     * Stratégie d'enchaînement des noeuds de grammaire
     * @param linkedGrammarNode
     * @param convertGrammarToLinkedGrammar
     */
    that.hydrateLinkedGrammarNode = function(linkedGrammarNode, convertGrammarToLinkedGrammar) {
        linkedGrammarNode.firsts = [linkedGrammarNode];
        linkedGrammarNode.lasts = [linkedGrammarNode];
    };
};

/**
 * Représente un noeud de grammaire, qui matche une séquence de noeuds.
 * @param value
 * @constructor
 */
microparser.grammar.Sequence = function(value) {
    var that = this;
    that.value = value;
    that.preventLoop = true;
    that.firsts = [_.first(value)];
    that.lasts = [_.last(value)];
    that.match = function(context) {
        var match = new microparser.parser.Match(context, that);
        match.matchedLength = 0;
        match.match = true;
        return match;
    };

    that.result = function(result) {
        return [result];
    };

    /**
     * Stratégie d'enchaînement des noeuds de grammaire
     * @param linkedGrammarNode
     * @param convertGrammarToLinkedGrammar
     */
    that.hydrateLinkedGrammarNode = function(linkedGrammarNode, convertGrammarToLinkedGrammar) {
        var currentNodes = [linkedGrammarNode];
        var subNodesResultFuncs = [];
        for (var i = 0, l = that.value.length; i < l; i++) {
            var subGrammar = that.value[i];
            var subNode = convertGrammarToLinkedGrammar(subGrammar);
            if (linkedGrammarNode.firsts.length === 0) linkedGrammarNode.firsts = subNode.firsts;
            linkedGrammarNode.lasts = subNode.lasts;

            _.each(currentNodes, function(currentNode) {
                if (currentNode.nexts.length > 0) return;
                currentNode.nexts = currentNode.nexts.concat(subNode.firsts);
            });

            currentNodes = subNode.lasts;
        }

        linkedGrammarNode.lasts = currentNodes;
    };
};

/**
 * Représente un noeud de grammaire, qui matche une liste de noeuds possibles.
 * @param value
 * @constructor
 */
microparser.grammar.Or = function(value) {
    var that = this;
    that.value = value;
    that.preventLoop = true;
    that.firsts = value;
    that.lasts = value;
    that.match = function(context) {
        var match = new microparser.parser.Match(context, that);
        match.matchedLength = that.value.length;
        match.match = (context.code.substr(context.offset, match.matchedLength) === that.value);
        return match;
    };

    /**
     * Stratégie d'enchaînement des noeuds de grammaire
     * @param linkedGrammarNode
     * @param convertGrammarToLinkedGrammar
     */
    that.hydrateLinkedGrammarNode = function(linkedGrammarNode, convertGrammarToLinkedGrammar) {
        _.each(that.value, function(subGrammar) {
            var subNode = convertGrammarToLinkedGrammar(subGrammar);
            linkedGrammarNode.firsts = linkedGrammarNode.firsts.concat(subNode.firsts);
            linkedGrammarNode.lasts = linkedGrammarNode.lasts.concat(subNode.lasts);
            linkedGrammarNode.nexts = linkedGrammarNode.nexts.concat(subNode.firsts);
        });
    };
};

/**
 * Représente un noeud du graphe connecté d'enchaînement des noeuds de la grammaire.
 * @param grammar
 * @constructor
 */
microparser.linkedGrammar = {};
microparser.linkedGrammar.Node = function(grammar) {
    var that = this;
    that.grammar = grammar;
    that.nexts = [];
    that.firsts = [];
    that.lasts = [];
};

/**
 * Calcule un graphe orienté d'enchaînement des noeuds de grammaire.
 * @param grammar
 */
microparser.linkedGrammar.create = function(grammar) {
    function convertGrammarToLinkedGrammar(grammar, antiLoopMap) {
        antiLoopMap = antiLoopMap || new Map();

        var node;
        if (grammar.preventLoop && (node = antiLoopMap.get(grammar))) {
            // On est dans une boucle => on retourne la référence qu'on a déjà.
            return node;
        }

        node = new microparser.linkedGrammar.Node(grammar);

        if (grammar.preventLoop) {
            antiLoopMap = antiLoopMap.clone();
            antiLoopMap.set(grammar, node);
        }

        grammar.hydrateLinkedGrammarNode(node, function(grammar) {
            return convertGrammarToLinkedGrammar(grammar, antiLoopMap);
        });

        return node;
    }

    return convertGrammarToLinkedGrammar(grammar, new Map());
};


/**
 * Représente un contexte.
 * @param code
 * @param offset
 * @constructor
 */
microparser.parser = {};
microparser.parser.Context = function(code, offset) {
    var that = this;
    that.code = code;
    that.offset = offset;
};

/**
 * Représente le résultat d'un match d'un noeud de grammaire par rapport à un contexte.
 * @param context
 * @param grammar
 * @constructor
 */
microparser.parser.Match = function(context, grammar) {
    var that = this;
    that.context = context;
    that.grammar = grammar;
    that.match = false;
    that.matchedLength = null;
};

/**
 * Représente un parser avec une grammaire donnée.
 * @param grammar
 * @constructor
 */
microparser.parser.Parser = function(grammar) {
    var that = this;
    that.linkedGrammarGraph = microparser.linkedGrammar.create(grammar);

    function parseNodes(context, linkedGrammarNodes) {
        var longestMatch = null;
        for(var i = 0, l = linkedGrammarNodes.length; i < l; i++) {
            var linkedGrammarNode = linkedGrammarNodes[i];

            var grammar = linkedGrammarNode.grammar;
            var match = grammar.match(context);
            if (match.match) {
                var nextContext = {
                    code: context.code,
                    offset: context.offset + match.matchedLength
                };

                var nexts = linkedGrammarNode.nexts;
                if (nexts.length > 0) {
                    match.next = parseNodes(nextContext, nexts);
                    if(!match.next.match) {
                        // On remonte le noeud qui n'a pas matché à la racine.
                        match = match.next;
                    }
                }
            }

            if(match.match) {
                return match;
            }

            // Ici, le noeud ne matche pas.
            if (!longestMatch || match.context.offset >= longestMatch.context.offset) {
                longestMatch = match;
            }
        }

        longestMatch.expected = longestMatch.expected || _.map(linkedGrammarNodes, function(linkedGrammarNode) {
            return linkedGrammarNode.grammar.value;
        });

        return longestMatch;
    }

    that.parse = function(code) {
        // On crée le contexte initial
        var context = new microparser.parser.Context(code, 0);
        var match = parseNodes(context, [that.linkedGrammarGraph]);

        if(!match.match) {
            var message = "Syntax error !\nExpected : " + _.map(match.expected, function(expected) {
                    return util.inspect(expected, {colors: true});
                }).join(", ") + "\nGot : " + match.context.code.substr(match.context.offset, 50);
            throw new Error(message);
        }

        console.log(util.inspect(match, {depth: 100, colors: true}));


        // Ici on a une suite de match valide.
        // On va alors évaluer chaque match.
        // TODO Ordonner le parcours correctement.
        var result = [];
        var currentMatch = match;
        do {
            if(currentMatch.grammar.result !== undefined) {
                var r = currentMatch.grammar.result(result);
                if(r !== undefined) result = r;
            }

            currentMatch = currentMatch.next;
        } while(currentMatch);

        return result;
    };
};

module.exports = microparser;
