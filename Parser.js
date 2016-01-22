

/**
 * Parser
 *
 * @param chainedGrammar
 * @constructor
 */
function Parser(chainedGrammar) {
    var that = this;

    that.parse = function(code) {
        var context = {
            code: code,
            offset: 0
        };

        var result = parse(context, chainedGrammar);
        return result;
    };

    function parse(context, chainedGrammarNodes) {
        for(var i in chainedGrammarNodes) {
            var chainedGrammarNode = chainedGrammarNodes[i];
            var m = tryToMatch(context, chainedGrammarNode);
            console.log(m);
            if(m.match) {
                var nexts = chainedGrammarNode.nexts;
                if(nexts.length > 0) {
                    return parse(m.nextContext, nexts);
                } else {
                    return m;
                }
            }
        }

        // TODO Stocker les matches KO pour affichage de l'erreur de syntaxe.
        return null;
    }

    function tryToMatch(context, chainedGrammarNode) {
        var grammar = chainedGrammarNode.grammar;
        if(grammar.type === "string") {
            return parseString(context, grammar.value);

        } else if(grammar.type === "regex") {
            return parseRegex(context, grammar.value);
        }
    }
}

module.exports = Parser;