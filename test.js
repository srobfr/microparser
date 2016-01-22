var util = require("util");
var mp = require(__dirname + "/index.js");

var shortGrammar = ["foo", "bar"];

var grammar = mp.shortGrammar.convert(shortGrammar);
console.log("grammar=", util.inspect(grammar, {
    colors: true,
        depth: 10
}));

var chainedGrammar = mp.grammarChainer.chain(grammar);
console.log("chainedGrammar=", util.inspect(chainedGrammar, {
    colors: true,
    depth: 10
}));

var code = "foobar";

var parser = new mp.Parser(chainedGrammar);
var result = parser.parse(code);

console.log("result=", util.inspect(result, {
    colors: true,
    depth: 10
}));