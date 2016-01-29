var _ = require("lodash");
var parser = require(__dirname + "/parser.js");

/**
 * Représente un noeud de grammaire, qui matche une chaîne.
 * @param value
 * @constructor
 */
var grammar = {};
grammar.String = function(value) {
    var that = this;
    that.value = value;
    that.match = function(context) {
        var match = new parser.Match(context, that);
        match.matchedLength = that.value.length;
        match.match = (context.code.substr(context.offset, match.matchedLength) === that.value);
        match.expected.push(that.value);
        return match;
    };

    that.result = function(match) {
        return value;
    };
};

grammar.Regex = function(value) {
    var that = this;
    that.value = value;
    that.match = function(context) {
        var match = new parser.Match(context, that);
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

grammar.Nothing = function() {
    var that = this;
    that.match = function(context) {
        var match = new parser.Match(context, that);
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
grammar.Sequence = function(value) {
    var that = this;
    that.value = value;
    that.match = function(context) {
        // On tente de matcher tous les sous-noeuds
        var match = new parser.Match(context, that);
        match.match = true;

        var currentContext = context;
        for(var i = 0, l = that.value.length; i < l; i++) {
            var subGrammar = that.value[i];
            var subMatch = subGrammar.match(currentContext);
            if(!subMatch.match) {
                return subMatch;
            }

            match.subMatches.push(subMatch);
            match.matchedLength += subMatch.matchedLength;
            currentContext = new parser.Context(currentContext.code, currentContext.offset + subMatch.matchedLength);
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
 * Représente un noeud de grammaire, qui matche une liste de noeuds possibles.
 * @param value
 * @constructor
 */
grammar.Or = function(value) {
    var that = this;
    that.value = value;
    that.match = function(context) {
        // On tente de matcher au moins un sous-noeuds
        var match = new parser.Match(context, that);
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

module.exports = grammar;