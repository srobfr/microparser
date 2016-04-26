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

            } else if (grammar.type === "decorate" && grammar.value) {
                node = new Grammar.Sequence([]);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value.push(convert(grammar.value));
                var prevNodeResult = node.result;
                node.result = function(match) {
                    var r = grammar.decorator(prevNodeResult(match));
                    return r;
                };

            } else if (grammar.type === "or" && grammar.value) {
                node = new Grammar.Or([]);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = _.map(grammar.value, convert);

            } else if (grammar.type === "multiple" && grammar.value) {
                node = new Grammar.Multiple(null);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = convert(grammar.value);

            } else if (grammar.type === "not" && grammar.value) {
                node = new Grammar.Not(null);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = convert(grammar.value);

            } else if (grammar.type === "test" && grammar.value) {
                node = new Grammar.Test(null);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = convert(grammar.value);

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

xmlGrammar.not = function(grammar) {
    return {type: "not", value: grammar};
};

xmlGrammar.test = function(grammar) {
    return {type: "test", value: grammar};
};

xmlGrammar.optional = function(grammar) {
    return xmlGrammar.or(grammar, xmlGrammar.not(grammar));
};

xmlGrammar.multiple = function(grammar, separator) {
    return [
        grammar,
        {type: "multiple", value: (separator === undefined ? grammar : [separator, grammar])}
    ];
};

xmlGrammar.until = function(grammar, separator, next) {
    var notNext = xmlGrammar.not(next);
    var one = [notNext, grammar];
    var s = (separator ? [notNext, separator] : undefined);
    return xmlGrammar.multiple(one, s);
};

xmlGrammar.decorate = function(grammar, decorator) {
    return {type: "decorate", value: grammar, decorator: decorator};
};

xmlGrammar.tag = function(tag, grammar) {
    return xmlGrammar.decorate(grammar, function(result) {
        return ["<" + tag + ">", result, "</" + tag + ">"];
    });
};

module.exports = xmlGrammar;