var _ = require("underscore");
var util = require("util");

function or() {
    return {type: "or", value: _.toArray(arguments)};
}

function optional(node) {
    return or(node, "");
}

function multiple(node) {
    var s = [node];
    var o = optional(s);
    s.push(o); // Référence croisée.
    return s;
}


// Affichage du déroulement
function dumpResult(next, indent) {
    if(indent.length > 50) {
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
var b = ["B"];
b.push("A", b, "C");
var grammar = [
    b
];

// -----------
//console.log = function() {};
console.log("grammar=", util.inspect(grammar, {
    colors: true,
    depth: 10
}));

var result = processGrammar(grammar);
//console.log("result=", util.inspect(result, {
//    colors: true,
//    depth: 99
//}));
console.log("====");
dumpResult(result.nexts, "");