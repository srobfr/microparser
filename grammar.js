var _ = require("lodash");
var Match = require(__dirname + "/parser.js").Match;
var Context = require(__dirname + "/parser.js").Context;

var grammar = {};

/**
 * Représente un noeud de grammaire, qui matche une chaîne.
 * @param value
 * @constructor
 */
grammar.String = function(value) {
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
grammar.Regex = function(value) {
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
grammar.Nothing = function() {
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
grammar.Sequence = function(value) {
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
 * Représente un noeud de grammaire, qui matche une liste de noeuds possibles.
 * @param value
 * @constructor
 */
grammar.Or = function(value) {
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

module.exports = grammar;