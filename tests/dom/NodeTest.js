const assert = require('assert');
const parserBuilder = new (require('../../src/dom/ParserBuilder'))();
const debug = require('debug')('microparser:NodeTest');
const util = require('util');
const {or, multiple, optional, tag} = require('../../src/dom/helpers');

describe('Node', function () {
    const parser = parserBuilder.build();

    describe('Simple usage', function () {
        const ow = optional(/^\s+/);
        const separator = tag('separator', [ow, ',', ow]);
        const g = tag('g', [tag('a', 'a'), separator, tag('b', 'b')]);
        const $ = parser.parse(g, 'a, b');

        it('xml', function () {
            assert.equal(`<g><a>a</a><separator>, </separator><b>b</b></g>`, $.xml());
        });
        it('text', function () {
            assert.equal(`a, b`, $.text());
        });
    });

    describe('Querying', function () {
        const a = ['a'];
        const b = 'b';
        const c = tag('c', or(a, b));
        const g = multiple(c);

        it('findByGrammar', function () {
            const $ = parser.parse(g, 'abbbaa');
            const $a = $.findByGrammar(a);
            assert.equal($a.length, 3);
            $a[1].parent.text('b');
            assert.equal($.text(), 'abbbba');
        });
        it('findByTag', function () {
            const $ = parser.parse(g, 'abbaba');
            const $c = $.findByTag('c');
            assert.equal($c.length, 6);
            $c[1].text('a');
            assert.equal($.text(), 'aababa');
        });
        it('findParentByGrammar', function () {
            const $ = parser.parse(g, 'abbbaa');
            const $c = $.findByGrammar(a)[1].findParentByGrammar(c);
            $c.text('b');
            assert.equal($.text(), 'abbbba');
        });
    });

    describe('Manipulation', function () {
        const item = /^\w/i;
        const g = multiple(item);
        it('Text update', function () {
            const $ = parser.parse(g, 'abcdef');
            $.findByGrammar(item)[1].text('B');
            assert.equal(`aBcdef`, $.text());
        });
        it('append', function () {
            const $ = parser.parse(g, 'abcdef');
            const $g = parser.parse(item, 'g');
            $.append($g);
            assert.equal(`abcdefg`, $.text());
        });
        it('prepend', function () {
            const $ = parser.parse(g, 'abcdef');
            const $g = parser.parse(item, 'g');
            $.prepend($g);
            assert.equal(`gabcdef`, $.text());
        });
        it('after', function () {
            const $ = parser.parse(g, 'abcdef');
            const $d = $.findByGrammar(item)[3];
            const $g = parser.parse(item, 'g');
            $d.after($g);
            assert.equal(`abcdgef`, $.text());
        });
        it('insertBefore', function () {
            const $ = parser.parse(g, 'abcdef');
            const $d = $.findByGrammar(item)[3];
            const $g = parser.parse(item, 'g');
            $d.before($g);
            assert.equal(`abcgdef`, $.text());
        });
    });
});
