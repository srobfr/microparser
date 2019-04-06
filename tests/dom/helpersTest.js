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

    describe('optmul', function () {
        it('Empty', function () {
            const $ = parser.parse(tag('optmul', optmul(tag('bar', 'bar'))), '');
            assert.equal(`<optmul/>`, $.xml());
        });
        it('Wrapped', function () {
            const $ = parser.parse(['!', tag('optmul', optmul(tag('bar', 'bar'))), '!'], '!!');
            assert.equal(`!<optmul/>!`, $.xml());
        });
        it('Wrapped2', function () {
            const $ = parser.parse(['!', tag('optmul', optmul(tag('bar', 'bar'))), '!'], '!bar!');
            assert.equal(`!<optmul><bar>bar</bar></optmul>!`, $.xml());
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

    it('Overlapping', function () {
        const w = /^[ \t\r\n]+/;
        const ow = optional(w);
        const char = /^[a-z_]/i;
        const list = multiple(char, [ow, ',', ow]);
        const $ = parser.parse(list, 'a , b,c,   d');
        assert.equal(`a , b,c,   d`, $.text());
    });

    it('Compound separator bug', function () {
        const owc = optmul(or(' ', [/^\/\*[^]+?\*\//]));
        const separator = [owc, ',', owc];
        const mult = multiple('a', separator);
        const g = ['(', owc, mult, owc, ')'];
        parser.parse(g, '( a  /** Test\n*/, a /* foo */ )');
    });
});
