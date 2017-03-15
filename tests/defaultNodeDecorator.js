const _ = require("lodash");
const assert = require('assert');
const Parser = require(__dirname + "/../Parser.js");
const {or, optional, multiple, optmul} = require(__dirname + "/../grammarHelpers.js");

describe('defaultNodeDecorator', function () {
    describe('Multiple', function () {
        it('add', function () {
            const parser = new Parser();
            const a = "a";
            const b = "b";
            const c = "c";
            const letter = or(a, b, c);
            const g = multiple(letter, ",");
            g.order = [a, b, c]; // Items order
            const code = `b`;
            const node = parser.parse(g, code);

            node.add("a");
            assert.equal(node.text(), "a,b");
            node.add("c");
            assert.equal(node.text(), "a,b,c");
        });

        it('remove', function () {
            const parser = new Parser();
            const a = "a";
            const b = "b";
            const c = "c";
            const letter = or(a, b, c);
            const g = multiple(letter, ",");
            g.order = [a, b, c]; // Items order
            const code = `b`;
            const node = parser.parse(g, code);

            node.add("a");
            node.add("c");
            assert.equal(node.text(), "a,b,c");
            node.remove(node.findOne(a));
            assert.equal(node.text(), "b,c");
            node.remove(node.findOne(c));
            assert.equal(node.text(), "b");
            node.add("a");
            node.add("c");
            assert.equal(node.text(), "a,b,c");
            node.remove(node.findOne(b));
            assert.equal(node.text(), "a,c");
        });

        it('remove error (empty parent)', function () {
            const parser = new Parser();
            const a = "a";
            const b = "b";
            const c = "c";
            const letter = or(a, b, c);
            const g = multiple(letter, ",");
            g.order = [a, b, c]; // Items order
            const code = `b`;
            const node = parser.parse(g, code);
            try {
                node.remove(node.findOne(b));
                assert.fail("An error should have been thrown.");
            } catch (e) {
                assert.equal(e.message, "Cannot delete node as the parent would be empty");
            }
        });

        it('remove error (not a child)', function () {
            const parser = new Parser();
            const a = "a";
            const b = "b";
            const c = "c";
            const letter = or(a, b, c);
            const g = multiple(letter, ",");
            g.order = [a, b, c]; // Items order
            const code = `a,b`;
            const node = parser.parse(g, code);
            const $c = parser.parse(c, "c");
            try {
                node.remove($c);
                assert.fail("An error should have been thrown.");
            } catch (e) {
                assert.equal(e.message, "Cannot remove this node as it is not contained in the current node");
            }
        });

        it('reorder', function () {
            const parser = new Parser();
            const letter = /^[a-z]/;
            const g = multiple(letter, ",");
            g.order = [(n) => n.text()]; // Alphabetic order
            const code = `a,b,c`;
            const $root = parser.parse(g, code);

            const $a = $root.findOne((n) => n.text() === "a");
            $a.setCode("z");
            assert.equal($root.text(), "z,b,c");
            $root.remove($a).add($a); // Reordering by removing & re-adding at the right place.
            assert.equal($root.text(), "b,c,z");
        });
    });

    describe('OptMul', function () {
        it('add', function () {
            const parser = new Parser();
            const a = "a";
            const b = "b";
            const c = "c";
            const letter = or(a, b, c);
            const g = optmul(letter, ",");
            g.order = [a, b, c]; // Items order
            const code = ``;
            const node = parser.parse(g, code);

            node.add("a");
            assert.equal(node.text(), "a");
            node.add("c");
            assert.equal(node.text(), "a,c");
            node.add("b");
            assert.equal(node.text(), "a,b,c");
        });

        it('remove', function () {
            const parser = new Parser();
            const a = "a";
            const b = "b";
            const c = "c";
            const letter = or(a, b, c);
            const g = optmul(letter, ",");
            g.order = [a, b, c]; // Items order
            const code = `c,b,a`;
            const node = parser.parse(g, code);

            node.remove(node.findOne(a));
            assert.equal(node.text(), "c,b");
            node.remove(node.findOne(c));
            assert.equal(node.text(), "b");
            node.add("a");
            node.add("c");
            assert.equal(node.text(), "a,b,c");
            node.remove(node.findOne(b));
            assert.equal(node.text(), "a,c");
            node.remove(node.findOne(a));
            node.remove(node.findOne(c));
            assert.equal(node.text(), "");
            node.add("a");
            assert.equal(node.text(), "a");
        });

        it('remove error (not a child)', function () {
            const parser = new Parser();
            const a = "a";
            const b = "b";
            const c = "c";
            const letter = or(a, b, c);
            const g = optmul(letter, ",");
            g.order = [a, b, c]; // Items order
            const code = `a,b`;
            const node = parser.parse(g, code);
            const $c = parser.parse(c, "c");
            try {
                node.remove($c);
                assert.fail("An error should have been thrown.");
            } catch (e) {
                assert.equal(e.message, "Cannot remove this node as it is not contained in the current node");
            }
        });

        it('reorder', function () {
            const parser = new Parser();
            const letter = /^[a-z]/;
            const g = optmul(letter, ",");
            g.order = [(n) => n.text()]; // Alphabetic order
            const code = `a,b,c`;
            const $root = parser.parse(g, code);

            const $a = $root.findOne((n) => n.text() === "a");
            $a.setCode("z");
            assert.equal($root.text(), "z,b,c");
            $root.remove($a).add($a); // Reordering by removing & re-adding at the right place.
            assert.equal($root.text(), "b,c,z");
        });
    });
});
