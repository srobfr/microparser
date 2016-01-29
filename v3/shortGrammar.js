var _ = require("lodash");
var util = require("util");
var Map = require(__dirname + "/Map.js");
var Grammar = require(__dirname + "/grammar.js");

var shortGrammar = {};

/**
 * Convertit une grammaire au format court en format utilisable par parser.Parser;
 * @param shortGrammar
 */
shortGrammar.convert = function(shortGrammar) {
    var alreadySeenGrammarNodesMap = new Map();

    function convert(grammar) {
        if (grammar === "") {
            return new Grammar.Nothing();

        } else if ((/boolean|number|string/).test(typeof grammar)) {
            return new Grammar.String("" + grammar);

        } else if (grammar instanceof RegExp) {
            return new Grammar.Regex(grammar);

        } else {
            var node = alreadySeenGrammarNodesMap.get(grammar);
            if (node) return node;

            if (Array.isArray(grammar)) {
                node = new Grammar.Sequence([]);
                alreadySeenGrammarNodesMap.set(grammar, node);

                if (grammar.length === 0) {
                    node.value.push(convert(''));
                } else {
                    _.each(grammar, function(g) {
                        node.value.push(convert(g));
                    });
                }

            } else if (grammar.type === "or" && grammar.value) {
                node = new Grammar.Or([]);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = _.map(grammar.value, convert);

            } else {
                node = grammar;
                alreadySeenGrammarNodesMap.set(grammar, node);
            }

            return node;
        }
    }

    return convert(shortGrammar);
};

shortGrammar.or = function() {
    return {type: "or", value: _.toArray(arguments)};
};

shortGrammar.optional = function(grammar) {
    return shortGrammar.or(grammar, '');
};

shortGrammar.multiple = function(grammar, separatorGrammar) {
    var r = [grammar];
    var s = (separatorGrammar ? [separatorGrammar, r] : r);
    r.push(shortGrammar.optional(s));
    return r;
};

shortGrammar.decorate = function(grammar, decorator) {
    var node = shortGrammar.convert(grammar);
    var nodeResultFunction = node.result;
    node.result = function(match) {
        return decorator(nodeResultFunction(match));
    };
    return node;
};

module.exports = shortGrammar;