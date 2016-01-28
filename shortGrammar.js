var _ = require("lodash");
var util = require("util");
var Map = require(__dirname + "/Map.js");

var shortGrammar = {};
module.exports = shortGrammar;

function _expandString(grammar) {
    var node = {};
    node.type = typeof grammar;
    node.value = grammar;

    // Fonction de match par défaut
    node.match = function(context) {
        var r = {};
        r.length = node.value.length;
        r.match = (context.code.substr(context.offset, r.length) === node.value);
        r.code = node.value;
        return r;
    };

    // Fonction de résultat par défaut
    node.result = function(result, match) {
        return [result, match.code];
    };

    return node;
}

function _expandRegex(grammar) {
    var node = {};
    node.type = "regex";
    node.value = grammar;

    // Fonction de match par défaut
    node.match = function(context) {
        var m = context.code.substr(context.offset).match(node.value);
        var r = {};
        r.match = (m !== null);
        r.code = (r.match ? m[0] : "");
        r.length = (r.match ? m[0].length : 0);
        r.groups = m;
        return r;
    };

    // Fonction de résultat par défaut
    node.result = function(result, match) {
        return [result, match.code];
    };

    return node;
}

shortGrammar.convert = function(shortGrammar) {
    var alreadySeenGrammarNodesMap = new Map();

    function _expand(grammar) {
        if ((/boolean|number|string/).test(typeof grammar)) {
            return _expandString("" + grammar);

        } else if (grammar instanceof RegExp) {
            return _expandRegex(grammar);

        } else {
            var node = alreadySeenGrammarNodesMap.get(grammar);
            if (node) return node;

            if (Array.isArray(grammar)) {
                node = {type: "sequence"};
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = [];

                if (grammar.length === 0) {
                    node.value.push(_expand(''));
                } else {
                    _.each(grammar, function(g) {
                        node.value.push(_expand(g));
                    });
                }

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

    return _expand(shortGrammar);
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