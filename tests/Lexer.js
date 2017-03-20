const _ = require("lodash");
const assert = require('assert');
const CompiledGrammar = require(__dirname + "/../CompiledGrammar.js");
const lexer = require(__dirname + "/../Lexer/lexer.js");
const {multiple, not, optional, optmul, or} = require(__dirname + "/../grammarHelpers.js");

describe('Lexer', function () {
    describe('Simple', function () {
        it('String', function () {
            const g = "Foo";
            const code = `Foo`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            const chain = lexer.lex(cg, code);
            assert.equal(chain.length, 2);
        });

        it('Too much code', function () {
            const g = "Foo";
            const code = `FooBar`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            try {
                const chain = lexer.lex(cg, code);
                assert.fail("Should throw an error");
            } catch (e) {
                assert.equal(e.message, `Syntax error on line 1, column 4:
FooBar
   ^ expected nothing`);
            }
        });

        it('Sequence', function () {
            const g = ["Foo", "Bar"];
            const code = `FooBar`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            const chain = lexer.lex(cg, code);
            assert.equal(chain.length, 6);
        });

        it('Not', function () {
            const g = [not("a"), /^\w+/];
            const code = `foo`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            const chain = lexer.lex(cg, code);
            // TODO
        });

        it('Not (error)', function () {
            const g = [not("a"), /^\w+/];
            const code = `afoo`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            assert.throws(() => {
                lexer.lex(cg, code);
            }, (err) => err.message === `Syntax error on line 1, column 1:
afoo
^ expected not('a')`);
        });

        it('Too much code 2', function () {
            const g = ["Foo", optional("Test")];
            const code = `FooBar`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            try {
                const chain = lexer.lex(cg, code);
                assert.fail("Should throw an error");
            } catch (e) {
                assert.equal(e.message, `Syntax error on line 1, column 4:
FooBar
   ^ expected 'Test' or nothing`);
            }
        });

        it('Error', function () {
            const g = ["Foo", "Bar"];
            const code = `FooMeh`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            try {
                const chain = lexer.lex(cg, code);
                assert.fail("Should throw an error");
            } catch (e) {
                assert.equal(e.message, `Syntax error on line 1, column 4:
FooMeh
   ^ expected 'Bar'`);
            }
        });
    });

    describe("Recursion", () => {
        it('missing start', () => {
            let g = [];
            g.push("(", optional(g), ")");
            g = [[g], /^$/];
            const code = `())`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            try {
                const chain = lexer.lex(cg, code);
                assert.fail("Should throw an error");
            } catch (e) {
                assert.equal(e.message, `Syntax error on line 1, column 3:
())
  ^ expected /^$/`);
            }
        });

        it('missing ending', () => {
            let g = [];
            g.push("(", optional(g), ")");
            g = [[g], /^$/];
            const code = `(()`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            try {
                const chain = lexer.lex(cg, code);
                assert.fail("Should throw an error");
            } catch (e) {
                assert.equal(e.message, `Syntax error on line 1, column 4:
(()
   ^ expected ')'`);
            }
        });

        it('syntax error 1', () => {
            let g = [];
            g.push("(", optional(g), ")");
            g = [[g], /^$/];
            const code = `((foo))`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            try {
                const chain = lexer.lex(cg, code);
                assert.fail("Should throw an error");
            } catch (e) {
                assert.equal(e.message, `Syntax error on line 1, column 3:
((foo))
  ^ expected '(' or ')'`);
            }
        });

        it('syntax error 2', () => {
            let g = [];
            g.push("(", optional(g), ")");
            g = [[g], /^$/];
            const code = `(()foo)`;
            const cg = CompiledGrammar.build(g);
            cg.check();
            try {
                const chain = lexer.lex(cg, code);
                assert.fail("Should throw an error");
            } catch (e) {
                assert.equal(e.message, `Syntax error on line 1, column 4:
(()foo)
   ^ expected ')'`);
            }
        });

    });

});

