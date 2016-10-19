var _ = require("lodash");
var cheerio = require("cheerio");
var Context = require(__dirname + "/Context.js");
var compiledGrammarTypes = require(__dirname + "/compiledGrammarTypes.js");

function Parser(grammar) {
    var that = this;

    var alreadySeenGrammarNodesMap = new Map();

    var compiledGrammar = compileGrammar(grammar);

    /**
     * Echappe une chaîne au format xml.
     * @param str
     * @return {*}
     */
    function xmlEscape(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /**
     * Compiles a grammar to a fast linked structure.
     * @param grammar
     * @return {Object}
     */
    function compileGrammar(grammar) {
        if (grammar === "") {
            return new compiledGrammarTypes.Nothing();

        } else if ((/boolean|number|string/).test(typeof grammar)) {
            var node = new compiledGrammarTypes.String("" + grammar);
            var previousResultFunc = node.result;
            node.result = function (match) {
                return xmlEscape(previousResultFunc(match));
            };
            return node;

        } else if (grammar instanceof RegExp) {
            var node = new compiledGrammarTypes.Regex(grammar);
            var previousResultFunc = node.result;
            node.result = function (match) {
                return xmlEscape(previousResultFunc(match));
            };
            return node;

        } else {
            var node = alreadySeenGrammarNodesMap.get(grammar);
            if (node) return node;

            if (Array.isArray(grammar)) {
                node = new compiledGrammarTypes.Sequence([]);
                alreadySeenGrammarNodesMap.set(grammar, node);

                if (grammar.length === 0) {
                    node.value.push(compileGrammar(''));
                } else {
                    _.each(grammar, function (g) {
                        node.value.push(compileGrammar(g));
                    });
                }

            } else if (grammar.type === "decorate" && grammar.value) {
                node = new compiledGrammarTypes.Sequence([]);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value.push(compileGrammar(grammar.value));
                var prevNodeResult = node.result;
                node.result = function (match) {
                    var r = grammar.decorator(prevNodeResult(match));
                    return r;
                };

            } else if (grammar.type === "or" && grammar.value) {
                node = new compiledGrammarTypes.Or([]);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = _.map(grammar.value, compileGrammar);

            } else if (grammar.type === "multiple" && grammar.value) {
                node = new compiledGrammarTypes.Multiple(null);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = compileGrammar(grammar.value);

            } else if (grammar.type === "not" && grammar.value) {
                node = new compiledGrammarTypes.Not(null);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = compileGrammar(grammar.value);

            } else if (grammar.type === "test" && grammar.value) {
                node = new compiledGrammarTypes.Test(null);
                alreadySeenGrammarNodesMap.set(grammar, node);
                node.value = compileGrammar(grammar.value);

            } else {
                node = grammar;
                alreadySeenGrammarNodesMap.set(grammar, node);
            }

            return node;
        }
    }

    /**
     * Parses the given code.
     * @param code
     * @return {Cheerio}
     */
    that.parse = function (code, $) {
        // Create the initial context.
        var context = new Context(code, 0);
        var match = compiledGrammar.match(context);

        if (!match.match) {
            var message = "Syntax error !\nExpected : " + _.map(match.expected, function (expected) {
                    return require("util").inspect(expected, {colors: true});
                }).join(", ") + "\nGot : " + match.context.code.substr(match.context.offset, 50);
            throw new Error(message);
        }

        // Successful parsing.
        // We calculate the result.
        var result = [];
        if (match.grammar.result) {
            var r = match.grammar.result(match);
            if (r !== undefined) result = r;
        }

        // Builds an XML string
        var xml = _.flattenDeep(result).join("");

        // Build a DOM part from this xml.
        if (!$) {
            // No DOM was provided, so we create a new one.
            $ = cheerio.load('<?xml version="1.0"?>' + "\n<root>" + xml + "</root>", {xmlMode: true});
            $.prototype.$ = $;
            $.prototype.xml = function() {
                return $.xml(this);
            };

            return $.root().children("root");
        }

        // Use the provided DOM element to parse the XML.
        return $($.parseHTML(xml));
    };
}

module.exports = Parser;
