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

        // Evaluation (2ème passe)
        var evalResult = [];
        var m = parsingResult;
        do {
            evalResult = m.grammar.result(evalResult, m);
            m = m.next;
        } while(m);
        return evalResult;
    };

    function parseTree(context, chainedGrammarNodes) {
        console.log(util.inspect(chainedGrammarNodes, {depth: 20, colors: true}));

        for(var i in chainedGrammarNodes) {
            var chainedGrammarNode = chainedGrammarNodes[i];
            var m = parseNode(context, chainedGrammarNode);
            if(m.match) {
                return m;
            }
        }

        // Erreur de syntaxe.
        var message = "Syntax error !\nExpected : " + _.map(chainedGrammarNodes, function(node) {
                return util.inspect(node.grammar.value, {colors: true});
            }).join(", ") + "\nGot : " + context.code.substr(context.offset, 50);

        throw new Error(message);
    }

    function parseNode(context, chainedGrammarNode) {
        var grammar = chainedGrammarNode.grammar;
        var m = grammar.match(context);
        m.grammar = grammar;
        if(m.match) {
            var nextContext = {
                code: context.code,
                offset: context.offset + m.length
            };

            var nexts = chainedGrammarNode.nexts;
            if(nexts.length > 0) {
                m.next = parseTree(nextContext, nexts);
            }
        }

        return m;
    }
}

module.exports = Parser;