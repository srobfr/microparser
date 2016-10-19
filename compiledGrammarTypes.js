var _ = require("lodash");
var Context = require(__dirname + "/Context.js");

var Match = function(context, grammar) {
    var that = this;
    that.context = context;
    that.grammar = grammar;
    that.match = false;
    that.matchedLength = 0;
    that.subMatches = [];
    that.expected = [];
};

/**
 * Basic grammar node types collection.
 * @constructor
 */
function CompiledGrammarTypes() {
    var that = this;

    /**
     * Représente un noeud de grammaire, qui matche une chaîne.
     * @param value
     * @constructor
     */
    that.String = function(value) {
        var that = this;
        that.value = value;
        that.match = function(context) {
            var match = new Match(context, that);
            match.matchedLength = that.value.length;
            match.match = (context.code.substr(context.offset, match.matchedLength) === that.value);
            match.expected.push(that.value);
            return match;
        };

        that.result = function(match) {
            return value;
        };
    };

    /**
     * Représente un noeud de grammaire, qui matche une regex.
     * @param value
     * @constructor
     */
    that.Regex = function(value) {
        var that = this;
        that.value = value;
        that.match = function(context) {
            var match = new Match(context, that);
            var code = context.code.substr(context.offset);
            var m = code.match(that.value);

            match.expected.push(that.value);
            match.match = (m !== null);
            if(m !== null) {
                match.matchedLength = m[0].length;
                match.groups = m;
            }

            return match;
        };

        that.result = function(match) {
            return match.groups[0];
        };
    };

    /**
     * Représente un noeud de grammaire, qui matche systématiquement.
     * @constructor
     */
    that.Nothing = function() {
        var that = this;
        that.match = function(context) {
            var match = new Match(context, that);
            match.expected.push(null);
            match.match = true;
            match.matchedLength = 0;
            return match;
        };
    };

    /**
     * Représente un noeud de grammaire, qui matche une séquence de noeuds.
     * @param value
     * @constructor
     */
    that.Sequence = function(value) {
        var that = this;
        that.value = value;
        that.match = function(context) {
            // On tente de matcher tous les sous-noeuds
            var match = new Match(context, that);
            match.match = true;

            var currentContext = context;
            for(var i = 0, l = that.value.length; i < l; i++) {
                var subGrammar = that.value[i];
                var subMatch = subGrammar.match(currentContext);
                match.expected = subMatch.expected;
                if(!subMatch.match) {
                    return subMatch;
                }

                match.subMatches.push(subMatch);
                match.matchedLength += subMatch.matchedLength;
                currentContext = new Context(currentContext.code, currentContext.offset + subMatch.matchedLength);
            }

            return match;
        };

        that.result = function(match) {
            var r = [];
            _.each(match.subMatches, function(match) {
                if(!match.grammar.result) return;
                r.push(match.grammar.result(match));
            });
            return r;
        };
    };

    /**
     * Représente un noeud de grammaire, qui matche mais sans avancer le pointeur.
     * @param value
     * @constructor
     */
    that.Test = function(value) {
        var that = this;
        that.value = value;
        that.match = function(context) {
            var subMatch = that.value.match(context);
            var match = new Match(context, that);
            match.match = subMatch.match;
            match.expected = match.expected.concat(subMatch.expected);
            return match;
        };
    };

    /**
     * Représente un noeud de grammaire, qui ne matche que si son sous-noeud ne matche pas.
     * @param value
     * @constructor
     */
    that.Not = function(value) {
        var that = this;
        that.value = value;
        that.match = function(context) {
            var subMatch = that.value.match(context);
            var match = new Match(context, that);
            match.match = !subMatch.match;
            match.subMatches.push(subMatch);
            match.expected = match.expected.concat({not: subMatch.expected});
            return match;
        };
    };

    /**
     * Représente un noeud de grammaire, qui matche une liste de noeuds possibles.
     * @param value
     * @constructor
     */
    that.Or = function(value) {
        var that = this;
        that.value = value;
        that.match = function(context) {
            // On tente de matcher au moins un sous-noeuds
            var match = new Match(context, that);
            match.match = false;

            var longestSubMatch = null;
            for(var i = 0, l = that.value.length; i < l; i++) {
                var subGrammar = that.value[i];
                var subMatch = subGrammar.match(context);
                if(subMatch.match) {
                    match.match = true;
                    match.matchedLength = subMatch.matchedLength;
                    match.subMatches.push(subMatch);
                    return match;
                }

                if(longestSubMatch === null || subMatch.context.offset > longestSubMatch.context) {
                    longestSubMatch = subMatch;
                } else if(subMatch.context.offset === longestSubMatch.context.offset) {
                    longestSubMatch.expected = longestSubMatch.expected.concat(subMatch.expected);
                }
            }

            return longestSubMatch;
        };

        that.result = function(match) {
            var r = [];
            _.each(match.subMatches, function(match) {
                if(!match.grammar.result) return;
                r.push(match.grammar.result(match));
            });
            return r;
        };
    };

    /**
     * Représente un noeud de grammaire, qui matche zéro ou plusieurs fois.
     * @param value
     * @constructor
     */
    that.Multiple = function(value) {
        var that = this;
        that.value = value;
        that.match = function(context) {
            // On tente de matcher plusieurs fois le sous-noeud
            var match = new Match(context, that);
            var currentContext = context;
            match.match = true;
            while(true) {
                var subGrammar = that.value;
                var subMatch = subGrammar.match(currentContext);
                if(!subMatch.match) {
                    break;
                }

                match.subMatches.push(subMatch);
                match.matchedLength += subMatch.matchedLength;
                currentContext = new Context(currentContext.code, currentContext.offset + subMatch.matchedLength);
            }

            match.expected = match.expected.concat(subMatch.expected);
            return match;
        };

        that.result = function(match) {
            var r = [];
            _.each(match.subMatches, function(match) {
                if(!match.grammar.result) return;
                r.push(match.grammar.result(match));
            });
            return r;
        };
    };
}

module.exports = new CompiledGrammarTypes();
