var _ = require("underscore");
var util = require("util");

// Construction de la syntaxe
var infiniteSequence = ["Infinite sequence"];
infiniteSequence.push(infiniteSequence);

var grammar = [
    "DEBUT",
    /^foo/,
    /^foo/,
    {type: "or", value: ["foo", "bar"]},
    {type: "qsdfqsdf", value: ["meh"]},
    infiniteSequence,
    ["1", /^2/],
    "FIN"
];

// -----------

console.log(util.inspect(grammar, {
    colors: true,
    depth: 10
}));

/**
 * Implémentation d'une Map
 * @constructor
 */
function Map() {
    var that = this;
    that.store = [];
    that.get = function (key) {
        return _.find(that.store, function (item) {
            return (item[0] === key);
        });
    };
    that.set = function (key, value) {
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
    var alreadySeenNodesMap = new Map();
    var references = [];
    function convertGrammarToWalkableGrammar(grammar) {
        if((/boolean|number|string/).test(typeof grammar)) {
            var node = {
                type: typeof grammar,
                value: grammar,
                getLast: function() {return node;},
                getFirst: function() {return node;}
            };
            return node;

        } else if(grammar instanceof RegExp) {
            var node = {
                type: "regex",
                value: grammar,
                getLast: function() {return node;},
                getFirst: function() {return node;}
            };
            return node;

        } else {
            var r = alreadySeenNodesMap.get(grammar);
            if(r) {
                // C'est une référence.
                references.push(r);
                var node = {
                    type: "reference",
                    value: references.length - 1
                };
                return node;
            }

            if(Array.isArray(grammar)) {
                r = {type: "sequence"};
                alreadySeenNodesMap.set(grammar, r);
                r.value = _.map(grammar, convertGrammarToWalkableGrammar);
                r.getLast = function() {return _.last(r.value).getLast();};
                r.getFirst = function() {return _.first(r.value).getFirst();};

            } else if (grammar.type && grammar.value) {
                r = {type: grammar.type};
                alreadySeenNodesMap.set(grammar, r);
                r.value = _.map(grammar.value, convertGrammarToWalkableGrammar);
                r.getLast = function() {return _.map(r.value, function(node) {return node.getLast();});};
                r.getFirst = function() {return _.map(r.value, function(node) {return node.getLast();});};
            }

            return r;
        }
    }

    var walkableGrammar = convertGrammarToWalkableGrammar(grammar);

    console.log(util.inspect(walkableGrammar.getLast(), {
        colors: true,
        depth: 10
    }));

}

var processedGrammar = processGrammar(grammar);
console.log(util.inspect(processedGrammar, {
    colors: true,
    depth: 10
}));
