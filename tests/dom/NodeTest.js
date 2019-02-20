const assert = require('assert');
const parserBuilder = new (require('../../src/dom/ParserBuilder'))();
const debug = require('debug')('microparser:NodeTest');
const util = require('util');
const {or, multiple, optional, optmul, tag} = require('../../src/dom/helpers');

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
            $a.get(1).parent.text('b');
            assert.equal($.text(), 'abbbba');
        });
        it('findByTag', function () {
            const $ = parser.parse(g, 'abbaba');
            const $c = $.findByTag('c');
            assert.equal($c.length, 6);
            $c.get(1).text('a');
            assert.equal($.text(), 'aababa');
        });
        it('findParentByGrammar', function () {
            const $ = parser.parse(g, 'abbbaa');
            const $c = $.findByGrammar(a).get(1).findParentByGrammar(c);
            $c.text('b');
            assert.equal($.text(), 'abbbba');
        });
    });

    describe('Manipulation', function () {
        const item = /^\w/i;
        const g = multiple(item);
        it('Text update', function () {
            const $ = parser.parse(g, 'abcdef');
            $.findByGrammar(item).get(1).text('B');
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
            const $d = $.findByGrammar(item).get(3);
            const $g = parser.parse(item, 'g');
            $d.after($g);
            assert.equal(`abcdgef`, $.text());
        });
        it('before', function () {
            const $ = parser.parse(g, 'abcdef');
            const $d = $.findByGrammar(item).get(3);
            const $g = parser.parse(item, 'g');
            $d.before($g);
            assert.equal(`abcgdef`, $.text());
        });
        it('misc', function () {
            const id = tag('id', /^\w+/);
            const separator = /^ *, */;
            const ow = optional(/^ +/);
            const listItem = or(id);

            const list = tag('list', ['(', ow, optmul(listItem, separator), ow, ')']);
            listItem.or.push(list);

            const $ = parser.parse(list, '(foo, bar   ,bplop, (             p, ((((())),p))))');
            $.findByGrammar(separator).text(', ');
            $.findByGrammar(ow).clean();
            for(const $id of $.findByGrammar(id)) $id.text($id.text().replace(/o/g, '0'));
            assert.equal(`(f00, bar, bpl0p, (p, ((((())), p))))`, $.text());
        });
    });
});
