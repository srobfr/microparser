var _ = require("lodash");
var util = require("util");
var grammarChainer = require(__dirname + "/grammarChainer.js");

/**
 * Parser
 *
 * @param grammar
 * @constructor
 */
function Parser(grammar) {
    var that = this;

    var chainedGrammar = grammarChainer.chain(grammar);

    that.parse = function(code) {
        var context = {
            code: code,
            offset: 0
        };

        // Parsing (1ère passe)
        var parsingResult = parseTree(context, chainedGrammar);

        if (parsingResult.match) {
            // Evaluation (2ème passe)
            var evalResult = [];
            var m = parsingResult;
            do {
                evalResult = m.grammar.result(evalResult, m);
                m = m.next;
            } while (m);
            return evalResult;
        }

        var message = "Syntax error !\nExpected : " + _.map(parsingResult.expected, function(expected) {
                return util.inspect(expected, {colors: true});
            }).join(", ") + "\nGot : " + parsingResult.context.code.substr(parsingResult.context.offset, 50);
        throw new Error(message);
    };

    function parseTree(context, chainedGrammarNodes) {
        var longestMatch = null;

        for (var i in chainedGrammarNodes) {
            var chainedGrammarNode = chainedGrammarNodes[i];
            var m = parseNode(context, chainedGrammarNode);
            if (m.match) {
                return m;
            }

            // Ici, le noeud ne matche pas.
            if (!longestMatch || m.context.offset >= longestMatch.context.offset) {
                longestMatch = m;
            }
        }

        longestMatch.expected = longestMatch.expected || _.map(chainedGrammarNodes, function(node) {
            return node.grammar.value;
        });

        return longestMatch;
    }

    function parseNode(context, chainedGrammarNode) {
        var grammar = chainedGrammarNode.grammar;
        var m = grammar.match(context);
        m.grammar = grammar;
        m.context = context;
        if (m.match) {
            var nextContext = {
                code: context.code,
                offset: context.offset + m.length
            };

            var nexts = chainedGrammarNode.nexts;
            if (nexts.length > 0) {
                m.next = parseTree(nextContext, nexts);
                if(!m.next.match) {
                    m = m.next;
                }
            }
        }

        return m;
    }
}

module.exports = Parser;