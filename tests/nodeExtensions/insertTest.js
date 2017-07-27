const _ = require("lodash");
const assert = require('assert');
const Microparser = require(__dirname + "/../../microparser.js");
const Parser = Microparser.Parser;
const {or, optional, multiple, optmul} = Microparser.grammarHelpers;

const parser = new Parser();

describe('Insert', function () {
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
            const $root = parser.parse(list, "");
            const $item = parser.parse(item, "-foo");
            $root.insert($item);
            assert.equal($root.text(), "-foo");
        });
        it('First position', function () {
            const $root = parser.parse(list, "-bar");
            const $item = parser.parse(item, "-foo");
            $root.insert($item, null);
            assert.equal($root.text(), "-foo-bar");
        });
        it('After a node', function () {
            const $root = parser.parse(list, "-a-b-c-d");
            const $item = parser.parse(item, "-foo");
            $root.insert($item, $root.children[2]);
            assert.equal($root.text(), "-a-b-c-foo-d");
        });
        it('First position (guessed, first order criteria)', function () {
            const $root = parser.parse(list, "-b-c-d");
            const $item = parser.parse(item, "+e");
            $root.insert($item, null);
            assert.equal($root.text(), "+e-b-c-d");
        });
        it('First position (guessed, second order criteria)', function () {
            const $root = parser.parse(list, "-b-c-d");
            const $item = parser.parse(item, "-a");
            $root.insert($item);
            assert.equal($root.text(), "-a-b-c-d");
        });
        it('Last position (guessed)', function () {
            const $root = parser.parse(list, "-b-c-d");
            const $item = parser.parse(item, "-e");
            $root.insert($item);
            assert.equal($root.text(), "-b-c-d-e");
        });
        it('Middle position (guessed)', function () {
            const $root = parser.parse(list, "-a-c-d");
            const $item = parser.parse(item, "-b");
            $root.insert($item);
            assert.equal($root.text(), "-a-b-c-d");
        });
        it('Middle position (guessed)', function () {
            const $root = parser.parse(list, "-a-c-d");
            const $item = parser.parse(item, "-b");
            $root.insert($item);
            assert.equal($root.text(), "-a-b-c-d");
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
            const $root = parser.parse(list, "");
            const $item = parser.parse(item, "-foo");
            $root.insert($item);
            assert.equal($root.text(), "-foo");
        });
        it('First position', function () {
            const $root = parser.parse(list, "-bar");
            const $item = parser.parse(item, "-foo");
            $root.insert($item, null);
            assert.equal($root.text(), "-foo, -bar");
        });
        it('After a node', function () {
            const $root = parser.parse(list, "-a,-b , -c, -d");
            const $item = parser.parse(item, "-foo");
            $root.insert($item, $root.findDirectByGrammar(item)[2]);
            assert.equal($root.text(), "-a,-b , -c, -foo, -d");
        });
    });
});

