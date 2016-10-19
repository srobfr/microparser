var microparser = require(__dirname + "/../microparser.js");
var g = microparser.grammarHelper;

// Parsing
// console.log(microparser.parse("foobar", "foo").xml()); // <root>foo</root>
//
// console.log(microparser.parse("foobar", /^foo/).xml()); // <root>foo</root>
//
// console.log(microparser.parse("foobar", ["foo", "bar"]).xml()); // <root>foobar</root>

console.log(microparser.parse("foobartest", ["foo", g.tag("b", "bar"), "test"]).xml()); // <root>foo<b>bar</b>test</root>



