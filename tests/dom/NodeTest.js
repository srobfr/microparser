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
        it('findByGrammar', function () {
            this.skip('TODO');
        });
        it('findByTag', function () {
            this.skip('TODO');
        });
        it('parent', function () {
            this.skip('TODO');
        });
    });

    describe('Manipulation', function () {

        const id = /^[a-z]+/;
        const g = tag('foo', ['(', tag('a', [id]), /^ *, */, tag('b', [id]), ')']);

        it('Text update', function () {
            const $ = parser.parse(g, '(a, b)');
            $.children[3].text('foo');
            assert.equal(`(a, foo)`, $.text());
            assert.equal(`<foo>(<a>a</a>, <b>foo</b>)</foo>`, $.xml());
        });
        it('append', function () {
            this.skip('TODO');
        });
        it('prepend', function () {
            this.skip('TODO');
        });
        it('insertAfter', function () {
            this.skip('TODO');
        });
        it('insertBefore', function () {
            this.skip('TODO');
        });
    });
});
