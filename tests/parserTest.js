const _ = require("lodash");
const assert = require('assert');
const Parser = require(__dirname + "/../Parser.js");
const {or, optional, multiple, optmul} = require(__dirname + "/../grammarHelpers.js");

describe('Parser', function () {
    it('Simple string', function () {
        const parser = new Parser();
        const g = "foo";
        const code = "foo";
        const $root = parser.parse(g, code);
        assert.equal("foo", $root.text());
    });

    it('Sequence', function () {
        const parser = new Parser();
        const g = ["foo", "bar"];
        const code = "foobar";
        const $root = parser.parse(g, code);
        assert.equal("foobar", $root.text());
    });

    it('Default code', function () {
        const parser = new Parser();
        const g = ["foo", "bar"];
        const $root = parser.parse(g, null);
        assert.equal("foobar", $root.text());
    });

    it('Node builder', function () {
        const parser = new Parser();
        const g = ["foo", "bar"];
        g.buildNode = function() {
            assert.equal(this.grammar, g);
            this.foo = "foo";
        };

        const $root = parser.parse(g, null);
        assert.equal("foo", $root.foo);
    });
});
