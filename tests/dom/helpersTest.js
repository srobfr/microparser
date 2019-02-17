const assert = require('assert');
const parserBuilder = new (require('../../src/dom/ParserBuilder'))();
const debug = require('debug')('microparser:helpersTest');
const util = require('util');
const {or, multiple, optional, tag, optmul} = require('../../src/dom/helpers');

describe('helpers', function () {
    const parser = parserBuilder.build();

    describe('or', function () {
        it('Simple', function () {
            const $ = parser.parse(tag('or', or('foo', 'bar')), 'bar');
            assert.equal(`<or>bar</or>`, $.xml());
        });
    });

    describe('multiple', function () {
        it('Simple', function () {
            const $ = parser.parse(tag('multiple', multiple(tag('bar', 'bar'))), 'barbarbarbar');
            assert.equal(`<multiple><bar>bar</bar><bar>bar</bar><bar>bar</bar><bar>bar</bar></multiple>`, $.xml());
        });
        it('Separator', function () {
            const $ = parser.parse(tag('multiple', multiple(tag('bar', 'bar'), tag('sep', ','))), 'bar,bar,bar,bar');
            assert.equal(7, $.children.length);
            assert.equal(`<multiple><bar>bar</bar><sep>,</sep><bar>bar</bar><sep>,</sep><bar>bar</bar><sep>,</sep><bar>bar</bar></multiple>`, $.xml());
        });
    });

    describe('optional', function () {
        it('Full', function () {
            const $ = parser.parse([tag('optional', optional('foo')), 'bar'], 'foobar');
            assert.equal(`<optional>foo</optional>bar`, $.xml());
        });
        it('Empty', function () {
            const $ = parser.parse([tag('optional', optional('foo')), 'bar'], 'bar');
            assert.equal(`<optional/>bar`, $.xml());
        });
        it('Error', function () {
            assert.throws(() => {
                parser.parse([tag('optional', optional('foo')), 'bar'], 'mehbar');
            }, /\n\^ expected 'foo' or 'bar'/);
        });
        it('Error 2', function () {
            assert.throws(() => {
                parser.parse(tag('optional', optional('foo')), 'meh');
            }, /\n\^ expected 'foo' or EOF/);
        });
    });

    it.only('Overlapping', function () {
        const w = /^[ \t\r\n]+/;
        const ow = optional(w);
        const ident = tag('ident', /^[a-z_][\w_]*/i);
        const list = multiple(ident, [ow, ',']);

        const $ = parser.parse(list, 'a,b');
        assert.equal(`<optional>foo</optional>bar`, $.xml());
    });
});
