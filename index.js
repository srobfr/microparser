var _ = require("lodash");
var util = require("util");
var grammarProcessor = require(__dirname + "/GrammarProcessor.js");
var gu = require(__dirname + "/GrammarUtils.js");

// Affichage du déroulement
function dumpResult(next, indent) {
    if (indent.length > 50) {
        console.log(indent, "***!! Loop !!***");
        return;
    }

    _.each(next, function(node) {
        console.log(indent, indent.length, util.inspect(node.grammar.value, {
            colors: true,
            depth: 10
        }));
        dumpResult(node.nexts, indent + " ");
    });
}

// ---

var i = ["i"];
i.push(i);
var grammar = ["plop", i, "fin"];

// -----------
//console.log = function() {};
console.log("grammar=", util.inspect(grammar, {
    colors: true,
    depth: 10
}));

var result = grammarProcessor.process(grammar);
console.log("result=", util.inspect(result, {
    colors: true,
    depth: 99
}));
console.log("====");
//dumpResult(result.nexts, "");