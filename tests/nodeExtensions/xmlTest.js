const _ = require("lodash");
const assert = require('assert');
const Microparser = require(__dirname + "/../../microparser.js");
const Parser = Microparser.Parser;
const {or, optional, multiple, optmul} = Microparser.grammarHelpers;

const parser = new Parser();

describe('Xml', function () {
    it('Simple string', function () {
        const $root = parser.parse("foo", "foo");
        assert.equal($root.xml(), "foo");
    });
    it('Escaped string', function () {
        const $root = parser.parse(">>foo&bar<<", ">>foo&bar<<");
        assert.equal($root.xml(), "&gt;&gt;foo&amp;bar&lt;&lt;");
    });
    it('Empty Node', function () {
        const empty = [/^/];
        empty.tag = "empty";
        const g = ["foo", empty, "bar"];
        const $root = parser.parse(g, "foobar");
        assert.equal($root.xml(), "foo<empty/>bar");
    });
    it('Node', function () {
        const foo = ["foo"];
        foo.tag = "foo";
        const $root = parser.parse(foo, "foo");
        assert.equal($root.xml(), "<foo>foo</foo>");
    });
});

