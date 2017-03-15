const _ = require("lodash");
const assert = require('assert');
const CompiledGrammar = require(__dirname + "/../CompiledGrammar.js");
const lexer = require(__dirname + "/../Lexer/lexer.js");
const Parser = require(__dirname + "/../Parser.js");
const {or, optional, multiple, optmul} = require(__dirname + "/../grammarHelpers.js");

describe('Parser', function () {
    it('Bench 1', function () {
        // TODO
    });

    it('Sequence', function () {
        const g = ["Foo", "Bar"];
        const code = `FooBar`;
        const cg = CompiledGrammar.build(g);
        cg.check();
        const chain = lexer.lex(cg, code);
        const node = parser.buildDom(chain);
        assert.equal(node.findOne("Foo").text(), "Foo");
        assert.equal(node.findOne("Bar").text(), "Bar");
        assert.equal(node.findOne("Plop"), null);
        assert.equal(node.findOne(g).text(), "FooBar");
    });

    it('Bench 2', function () {
        const w = /^[ \t\r\n]+/;
        const ow = optional(w);
        const quotedString = /^'(\\'|[^']+)*'/;
        const doubleQuotedString = /^"(\\"|[^"]+)*"/;
        const string = or(quotedString, doubleQuotedString);
        const numeric = /^(-?)(\d*\.\d+|\d+[eE]\d+|0x[\da-f]+|\d+)/i;
        const ident = /^[a-z_][\w_]*/i;

        const values = [];
        const value = or(string, numeric, ident, values);

        const postCommaOw = [ow];
        const otherOw = [ow];
        values.push("[", otherOw, optmul(value, [otherOw, ",", postCommaOw]), otherOw, "]");
        const code = `[   ident , "foo",
         
         [bar   ], ident2]`;

        const $root = parser.parse(value, code);

        // Compactage
        _.each($root.find(otherOw), (n) => {n.setCode("");});
        _.each($root.find(postCommaOw), (n) => {n.setCode(" ");});

        console.log($root.text());
    });
});
