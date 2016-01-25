var util = require("util");
var mp = require(__dirname + "/index.js");


var or = mp.shortGrammar.or;

var shortGrammar = ["foo", or(/^Foo/, "Bar", "test", "meh", ["bar"]), "blop \ntest"];
var code = "foobarblop \ntest";

var grammar = mp.shortGrammar.convert(shortGrammar);
console.log("grammar=", util.inspect(grammar, {
    colors: true,
        depth: 10
}));

var parser = new mp.Parser(grammar);
var result = parser.parse(code);

console.log("result=", util.inspect(result, {
    colors: true,
    depth: 10
}));