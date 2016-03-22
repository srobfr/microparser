var util = require("util");
var _ = require("lodash");

var parser = {};

/**
 * Représente un contexte.
 * @param code
 * @param offset
 * @constructor
 */
parser.Context = function(code, offset) {
    var that = this;
    that.code = code;
    that.offset = offset;
};

/**
 * Représente le résultat d'un match d'un noeud de grammaire par rapport à un contexte.
 * @param context
 * @param grammar
 * @constructor
 */
parser.Match = function(context, grammar) {
    var that = this;
    that.context = context;
    that.grammar = grammar;
    that.match = false;
    that.matchedLength = 0;
    that.subMatches = [];
    that.expected = [];
};

/**
 * Représente un parser avec une grammaire donnée.
 * @param grammar
 * @constructor
 */
parser.Parser = function(grammar) {
    var that = this;

    that.parse = function(code) {
        // On crée le contexte initial
        var context = new parser.Context(code, 0);
        var pMatch = grammar.match(context);
        return pMatch.then(function(match) {
            if(!match.match) {
                var message = "Syntax error !\nExpected : " + _.map(match.expected, function(expected) {
                        return util.inspect(expected, {colors: true});
                    }).join(", ") + "\nGot : " + match.context.code.substr(match.context.offset, 50);
                throw new Error(message);
            }

            // Ici on a un match.
            // On va calculer le résultat.
            var result = [];
            if(match.grammar.result) {
                var r = match.grammar.result(match);
                if(r !== undefined) result = r;
            }

            return result;
        });
    };
};

module.exports = parser;
