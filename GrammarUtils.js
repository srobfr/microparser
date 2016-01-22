var _ = require("lodash");

var GrammarUtils = {};

GrammarUtils.or = function() {
    return {type: "or", value: _.toArray(arguments)};
};

GrammarUtils.optional = function(grammar) {
    return GrammarUtils.or(grammar, '');
};

GrammarUtils.multiple = function(grammar, separatorGrammar) {
    var r = [grammar];
    var s = (separatorGrammar ? [separatorGrammar, r] : r);
    r.push(GrammarUtils.optional(s));
    return r;
};

module.exports = GrammarUtils;