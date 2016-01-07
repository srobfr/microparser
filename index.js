var _ = require("underscore");
var util = require("util");

// Construction de la syntaxe
var infiniteSequence = ["Infinite sequence"];
infiniteSequence.push(infiniteSequence);

var grammar = [
    "DEBUT",
    'foo',
    'foo',
    /^test/,
    /^test/,
    "FIN"
];

function or() {
    return {type: "or", nodes: _.toArray(arguments)};
}

function optional(node) {
    return {type: "or", nodes: [node, ""]};
}

function multiple(node) {
    var s = [node];
    var o = optional(s);
    s.push(o); // Référence croisée.
    return s;
}

// -----------


function processGrammar(grammar) {
    var flatGrammar = [];

    function getDictItem(key) {
        var r = _.find(flatGrammar, function (item) {
            return (item[0] === key);
        });

        if (r) return r[1];
    }

    function setDictItem(key, value) {
        flatGrammar.push([key, value]);
    }

    function isScalar(value) {
        return (/boolean|number|string/).test(typeof value);
    }

    function flattenGrammar(grammar) {
        // Si on a une valeure scalaire, on la transforme en objet car elle risque d'apparaître ailleurs dans la grammaire.
        if(isScalar(grammar)) {
            grammar = {scalar: grammar};
        }

        var item = getDictItem(grammar);
        if (item !== undefined) return;
        setDictItem(grammar, {});

        if (Array.isArray(grammar) && grammar.length > 0) {
            _.each(grammar, flattenGrammar);
        } else if (grammar.type && grammar.nodes) {
            _.each(grammar.nodes, flattenGrammar);
        }
    }

    // On applatit l'arbre cyclique de grammaire
    flattenGrammar(grammar);

    console.log(util.inspect(flatGrammar, {
        colors: true,
        depth: 10
    }));

    // Puis on traite tous les noeuds séquentiellement.
    _.each(flatGrammar, function (item) {
        var grammar = item[0];
        var node = item[1];

        if(grammar.scalar) {
            node.type = (grammar.scalar instanceof RegExp ? "regex" : typeof grammar.scalar);
            node.value = grammar.scalar;
            node.next = [];

        } else if (Array.isArray(grammar)) {
            node.type = "sequence";
            node.value = _.map(grammar, function (item) {
                return getDictItem(item);
            });

        } else if (grammar.type === "or" && grammar.nodes) {
            node.type = "or";
            node.value = _.map(grammar.nodes, function (item) {
                return getDictItem(item);
            });
        }
    });

    // Puis on connecte les noeuds entre eux, en partant du noeud principal
    _.each(flatGrammar, function (item) {
        var node = item[1];
        if (node.type === "regex" || node.type === "string") {
            node.connect = function (previous, next, skip) {
                if(!_.contains(skip, node)) {
                    _.each(previous, function (p) {
                        p.connect([], [node], skip);
                    });
                    _.each(next, function (n) {
                        if (_.contains(node.next, n)) return;
                        node.next.push(n);
                    });
                }

                return node.getFirsts();
            };
            node.getFirsts = function() {
                return [node];
            };

        } else if (node.type === "sequence") {
            node.connect = function (previous, next, skip) {
                if(!_.contains(skip, node)) {
                    skip = skip.concat(node);
                    _.first(node.value).connect(previous, [], skip);
                    for (var i = 0; i < node.value.length - 1; i++) {
                        node.value[i].connect([], node.value[i + 1].getFirsts(), skip);
                    }
                    _.last(node.value).connect([], next, skip);
                }

                return node.getFirsts();
            };
            node.getFirsts = function() {
                return _.first(node.value).getFirsts();
            };

        } else if (node.type === "or") {
            node.connect = function (previous, next, skip) {
                if(!_.contains(skip, node)) {
                    skip = skip.concat(node);
                    _.each(node.value, function (subNode) {
                        subNode.connect(previous, next, [node], skip);
                    });
                }
                return node.getFirsts();
            };
            node.getFirsts = function() {
                return _.flatten(_.map(node.value, function(subNode) {
                    return subNode.getFirsts();
                }));
            };
        }
    });

    var mainNode = getDictItem(grammar);
    var startNodes = mainNode.connect([], [], []);

    // Nettoyage
    _.each(flatGrammar, function (item) {
        var node = item[1];
        delete node.connect;
        delete node.getFirsts;
    });

    // Puis on retourne les noeuds de départ
    return startNodes;
}

console.log(util.inspect(grammar, {
    colors: true,
    depth: 10
}));

var processedGrammar = processGrammar(grammar);
console.log(util.inspect(processedGrammar, {
    colors: true,
    depth: 99
}));
