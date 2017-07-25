const _ = require("lodash");
const assert = require('assert');
const Microparser = require(__dirname + "/../../microparser.js");
const Parser = Microparser.Parser;
const {or, optional, multiple, optmul} = Microparser.grammarHelpers;

const parser = new Parser();

describe('Search', function () {
    describe('Tags', function () {
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
            const $tag = $root.findOneDirectByTag("foo");
            assert.equal($tag.text(), "foo");
            assert.equal($tag.grammar, foo);
            const $notFound = $root.findOneDirectByTag("notfound");
            assert.equal(null, $notFound);
            assert.equal($tag.grammar, foo);
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
});

