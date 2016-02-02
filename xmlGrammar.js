var _ = require("lodash");
var Map = require(__dirname + "/Map.js");
var Grammar = require(__dirname + "/grammar.js");

var xmlGrammar = {};

/**
 * Echappe une chaîne au format xml.
 * @param str
 * @return {*}
 */
function xmlEscape(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Convertit une grammaire au format court en format utilisable par parser.Parser;
 * @param grammar
 */
xmlGrammar.convert = function(grammar) {
    var alreadySeenGrammarNodesMap = new Map();

    function convert(grammar) {
        if (grammar === "") {
            return new Grammar.Nothing();

        } else if ((/boolean|number|string/).test(typeof grammar)) {
            var node = new Grammar.String("" + grammar);
            var previousResultFunc = node.result;
            node.result = function(match) {
                return xmlEscape(previousResultFunc(match));
            };
            return node;

        } else if (grammar instanceof RegExp) {
            var node = new Grammar.Regex(grammar);
            var previousResultFunc = node.result;
            node.result = function(match) {
                return xmlEscape(previousResultFunc(match));
            };
            return node;

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

    return convert(grammar);
};

xmlGrammar.or = function() {
    return {type: "or", value: _.toArray(arguments)};
};

xmlGrammar.optional = function(grammar) {
    return xmlGrammar.or(grammar, '');
};

xmlGrammar.multiple = function(grammar, separatorGrammar) {
    var r = [grammar];
    var s = (separatorGrammar ? [separatorGrammar, r] : r);
    r.push(xmlGrammar.optional(s));
    return r;
};

xmlGrammar.multipleUngreedy = function(grammar, separatorGrammar) {
    var one = grammar;
    var more = [];
    more.push(separatorGrammar ? [grammar, separatorGrammar, more] : [grammar, grammar]);

    return r;
};

xmlGrammar.decorate = function(grammar, decorator) {
    var node = xmlGrammar.convert(grammar);
    var nodeResultFunction = node.result;
    node.result = function(match) {
        return decorator(nodeResultFunction(match));
    };
    return node;
};

xmlGrammar.tag = function(tag, grammar) {
    return xmlGrammar.decorate(grammar, function(result) {
        return ["<" + tag + ">", result, "</" + tag + ">"];
    });
};

module.exports = xmlGrammar;