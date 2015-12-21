var _ = require("underscore");
var util = require("util");

var grammar = [
    "F",
    /^oo/,
    or("Foo", "Bar"),
    optional("Test"),
    "plop",
    multiple("bar"),
    ["subArray"],
    /^$/
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

function processGrammar(grammar, alreadyVisited) {
    alreadyVisited = (alreadyVisited||[]);

    if (grammar instanceof RegExp) {
        return {
            type: "regex",
            value: grammar
        };

    } else if (typeof grammar === "string") {
        return {
            type: "string",
            value: grammar
        };

    } else if (Array.isArray(grammar) && grammar.length > 0) {
        // On filtre les noeuds déjà visités
        var nodes = _.difference(grammar, alreadyVisited);

        var subNodes = _.map(nodes, function(node) {
            return processGrammar(node, alreadyVisited);
        });

        // On connecte les sous-noeuds entre eux
        for (var i = 0; i < subNodes.length - 1; i++) {
            var leafs = getLeafs(subNodes[i]);
            _.each(leafs, function (leaf) {
                leaf.next = subNodes[i + 1];
            });
        }

        return subNodes[0];

    } else if (grammar.type === "or" && grammar.nodes) {
        // On filtre les noeuds déjà visités
        var nodes = _.difference(grammar.nodes, alreadyVisited);

        return _.map(nodes, function(node) {
            return processGrammar(node, alreadyVisited);
        });
    }

    console.log("Non géré :", grammar); // Non géré
}

function getLeafs(node, alreadyVisited) {
    alreadyVisited = (alreadyVisited||[]);

    // On définit la liste de noeuds sur laquelle on travaille.
    var nodes;
    if (Array.isArray(node)) nodes = node;
    else if (node.next === undefined) return [node]; // C'est une feuille
    else if (Array.isArray(node.next)) nodes = node.next;
    else nodes = [nodes.next];

    // On filtre les noeuds déjà visités
    nodes = _.difference(nodes, alreadyVisited);

    return _.flatten(_.map(nodes, function(node) {
        alreadyVisited.push(node);
        return getLeafs(node, alreadyVisited);
    }));
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
