const _ = require("lodash");
const assert = require('assert');
const Parser = require(__dirname + "/../Parser.js");
const {or, optional, multiple, optmul} = require(__dirname + "/../grammarHelpers.js");

describe('Parser', function () {
    it('Simple string', function () {
        const parser = new Parser({nodeDecorator: null});
        const g = "foo";
        const code = "foo";
        const $root = parser.parse(g, code);
        assert.equal("foo", $root.text());
    });

    it('Sequence', function () {
        const parser = new Parser({nodeDecorator: null});
        const g = ["foo", "bar"];
        const code = "foobar";
        const $root = parser.parse(g, code);
        assert.equal("foobar", $root.text());
        assert.equal("foo", $root.findOne("foo").text());
        assert.equal("bar", $root.findOne("bar").text());
    });
});
