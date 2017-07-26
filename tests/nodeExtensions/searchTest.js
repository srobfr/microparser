const _ = require("lodash");
const assert = require('assert');
const Microparser = require(__dirname + "/../../microparser.js");
const Parser = Microparser.Parser;
const {or, optional, multiple, optmul} = Microparser.grammarHelpers;

const parser = new Parser();

describe('Search', function () {
    describe('By tags', function () {
        it('findDirectByTag', function () {
            const foo = ["foo"];
            foo.tag = "foo";

            const g = multiple(foo);

            const code = "foofoo";
            const $root = parser.parse(g, code);
            const $tags = $root.findDirectByTag("foo");
            assert.equal($tags.length, 2);
            assert.equal($tags[0].text(), "foo");
            assert.equal($tags[0].grammar, foo);
        });

        it('findOneDirectByTag', function () {
            const foo = ["foo"];
            foo.tag = "foo";
            const g = multiple(foo);
            const code = "foofoo";
            const $root = parser.parse(g, code);
            const $node = $root.findOneDirectByTag("foo");
            assert.equal($node.text(), "foo");
            assert.equal($node.grammar, foo);
            const $notFound = $root.findOneDirectByTag("notfound");
            assert.equal(null, $notFound);
        });

        it('findByTag', function () {
            const foo = [/^foo/i];
            foo.tag = "foo";
            const bar = [/^bar/i];
            bar.tag = "bar";

            const g = multiple(or(foo, bar));

            const code = "foofooBarFoo";
            const $root = parser.parse(g, code);
            const $barTags = $root.findByTag("bar");
            assert.equal($barTags.length, 1);
            assert.equal($barTags[0].text(), "Bar");
            assert.equal($barTags[0].grammar, bar);
            const $fooTags = $root.findByTag("foo");
            assert.equal($fooTags.length, 3);
        });

        it('findOneByTag', function () {
            const foo = [/^foo/i];
            foo.tag = "foo";
            const bar = [/^bar/i];
            bar.tag = "bar";

            const g = multiple(or(foo, bar));

            const code = "fooFooBarFOO";
            const $root = parser.parse(g, code);
            const $barTag = $root.findOneByTag("bar");
            assert.equal($barTag.text(), "Bar");
            const $plopTag = $root.findOneByTag("plop");
            assert.equal($plopTag, null);
        });
    });
    describe('By predicate', function () {
        it('findDirectByPredicate', function () {
            const foo = [/^foo/i];
            const g = multiple(foo);
            const $root = parser.parse(g, "foofOo");
            const $node = $root.findDirectByPredicate($n => $n.text().match(/O/));
            assert.equal($node.length, 1);
            assert.equal($node[0].text(), "fOo");
            assert.equal($node[0].grammar, foo);
        });

        it('findOneDirectByPredicate', function () {
            const foo = [/^foo/i];
            const g = multiple(foo);
            const code = "foofOo";
            const $root = parser.parse(g, code);
            const $node = $root.findOneDirectByPredicate($n => $n.text().match(/O/));
            assert.equal($node.text(), "fOo");
            assert.equal($node.grammar, foo);
            const $notFound = $root.findOneDirectByPredicate($n => false);
            assert.equal(null, $notFound);
        });

        it('findByPredicate', function () {
            const foo = [/^foo/i];
            const bar = [/^bar/i];
            const g = multiple(or(foo, bar));
            const $root = parser.parse(g, "foofOoBarFoo");
            const $bars = $root.findByPredicate($n => $n.grammar === bar);
            assert.equal($bars.length, 1);
            assert.equal($bars[0].text(), "Bar");
            assert.equal($bars[0].grammar, bar);
            const $foos = $root.findByPredicate($n => $n.grammar === foo);
            assert.equal($foos.length, 3);
        });

        it('findOneByPredicate', function () {
            const foo = [/^foo/i];
            const bar = [/^bar/i];
            const g = multiple(or(foo, bar));
            const $root = parser.parse(g, "fooFooBarFOO");
            const $bar = $root.findOneByPredicate($n => $n.grammar === bar);
            assert.equal($bar.text(), "Bar");
            const $notFound = $root.findOneByPredicate($n => false);
            assert.equal($notFound, null);
        });
    });
});

