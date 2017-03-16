const _ = require("lodash");
const assert = require('assert');
const CompiledGrammar = require(__dirname + "/../CompiledGrammar.js");
const {or, optional, multiple, optmul} = require(__dirname + "/../grammarHelpers.js");

describe('CompiledGrammar', function () {
    it('String', () => {
        let g = "foo";
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Regex', () => {
        let g = /^foo/;
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Regex without ^', () => {
        let g = /foo/;
        const cg = CompiledGrammar.build(g);
        try {
            cg.check();
            assert.fail("This check should throw an error.");
        } catch (e) {
            assert.equal(e.message, "Regex grammar should start with '^' : /foo/");
        }
    });

    it('Sequence', () => {
        let g = ["foo", "bar"];
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Recursion with exit', function () {
        let g = [];
        g.push("(", optional(g), ")");
        const cg = CompiledGrammar.build(g);
        cg.check();
    });

    it('Infinite recursion', function () {
        let g = [];
        g.push("(", g, ")");
        const cg = CompiledGrammar.build(g);
        try {
            cg.check();
            assert.fail("This check should throw an error.");
        } catch (e) {
            assert.equal(e.message, "No exit node found : [ '(', [Circular], ')' ]");
        }
    });

    it('Or', () => {
        let g = or("foo", "bar");
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Optional', () => {
        let g = optional("foo");
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Multiple', () => {
        let g = multiple("foo");
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Multiple with separator', () => {
        let g = multiple("foo", ",");
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Optional multiple', () => {
        let g = optmul("foo");
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Optional multiple with separator', () => {
        let g = optmul("foo", ",");
        const cg = CompiledGrammar.build(g);
        cg.check();
        console.log(cg.dump());
    });

    it('Unrecognized grammar type', function () {
        let g = {foo: "bar"};
        try {
            const cg = CompiledGrammar.build(g);
            assert.fail("This check should throw an error.");
        } catch (e) {
            assert.equal(e.message, "Unrecognized grammar type : { foo: 'bar' }");
        }
    });
});
