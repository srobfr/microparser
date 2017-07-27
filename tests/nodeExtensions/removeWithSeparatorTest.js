const _ = require("lodash");
const assert = require('assert');
const Microparser = require(__dirname + "/../../microparser.js");
const Parser = Microparser.Parser;
const {or, optional, multiple, optmul} = Microparser.grammarHelpers;

const parser = new Parser();

describe('Remove with separator', function () {
    describe('Without separators', function () {
        const ident = /^[a-z_][\w_]*/i;
        const marker = or("-", "+");
        const item = [marker, ident];
        const list = optmul(item);
        list.order = [
            "+", "-", // First, sort by marker (+ first).
            ($item => $item.text().toLowerCase()), // Second, sort alphabetically (case-insensitive)
        ];

        it('One item', function () {
            const $root = parser.parse(list, "-a");
            const $item = $root.children[0];
            $item.removeWithSeparator();
            assert.equal($root.text(), "");
        });
        it('First position', function () {
            const $root = parser.parse(list, "-a-b");
            const $item = $root.children[0];
            $item.removeWithSeparator();
            assert.equal($root.text(), "-b");
        });
        it('After a node', function () {
            const $root = parser.parse(list, "-a-b");
            const $item = $root.children[1];
            $item.removeWithSeparator();
            assert.equal($root.text(), "-a");
        });
    });
    describe('With separators', function () {
        const w = /^[ \t\r\n]+/;
        const ow = optional(w);
        const ident = /^[a-z_][\w_]*/i;
        const marker = or("-", "+");
        const item = [marker, ident];
        const separator = [ow, ",", ow];
        separator.default = ", ";
        const list = optmul(item, separator);
        list.order = [
            "+", "-", // First, sort by marker (+ first).
            ($item => $item.text().toLowerCase()), // Second, sort alphabetically (case-insensitive)
        ];

        it('One item', function () {
            const $root = parser.parse(list, "-a");
            const $item = $root.findDirectByGrammar(item)[0];
            $item.removeWithSeparator();
            assert.equal($root.text(), "");
        });
        it('First position', function () {
            const $root = parser.parse(list, "-a, -b");
            const $item = $root.findDirectByGrammar(item)[0];
            $item.removeWithSeparator();
            assert.equal($root.text(), "-b");
        });
        it('Middle position', function () {
            const $root = parser.parse(list, "-a , -b,-c");
            const $item = $root.findDirectByGrammar(item)[1];
            $item.removeWithSeparator();
            assert.equal($root.text(), "-a,-c");
        });
        it('Last position', function () {
            const $root = parser.parse(list, "-a , -b");
            const $item = $root.findDirectByGrammar(item)[1];
            $item.removeWithSeparator();
            assert.equal($root.text(), "-a");
        });
    });
});

