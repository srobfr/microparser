const _ = require("lodash");
const assert = require('assert');
const Microparser = require(__dirname + "/../../microparser.js");
const Parser = Microparser.Parser;
const {or, optional, multiple, optmul} = Microparser.grammarHelpers;

const parser = new Parser();

describe('Manipulation', function () {
    describe('Simple value', function () {
        // Let's build a simple grammar (php variables identifiers, e.g. "$fooBar")
        // First, the identifier (letters + digits + some symbols, cannot start with a digit)
        const ident = /^[a-z_][\w_]*/i;

        // A variable is an identifier prefixed by a "$".
        const variable = ["$", ident];
        variable.buildNode = function (self) {
            /**
             * Get/set the variable name. This is equivalent to get/set the embedded identifier text.
             * @param {string|undefined} name
             */
            self.name = (name) => {
                const $ident = this.children[1];
                const r = $ident.text(name);
                return (name === undefined ? r : self);
            };
        };

        it('Get value', function () {
            const $root = parser.parse(variable, "$foo");
            assert.equal($root.name(), "foo");
        });
        it('Set value', function () {
            const $root = parser.parse(variable, "$foo");
            $root.name("bar");
            assert.equal($root.text(), "$bar");
        });
    });

    describe('Optional value', function () {
        // This time, we build a grammar for a simple function, which can have an optional visibility prefix.
        const w = /^[ \t\r\n]+/;
        const ident = /^[a-z_][\w_]*/i;
        const visibility = or("public", "protected", "private");
        const visibilityPrefix = optional([visibility, w]);
        visibilityPrefix.buildNode = function (self) {
            self.visibility = (visibility) => {
                let $visibility = self.children.length === 0 ? null : self.children[0].children[0];
                if (visibility === undefined) {
                    // Get
                    return $visibility ? $visibility.text() : null;
                }

                if (visibility === null) {
                    // Remove
                    if ($visibility) self.empty();
                } else if (!$visibility) {
                    // Create
                    self.text(`${visibility} `);
                } else {
                    // Update
                    $visibility.text(visibility);
                }

                return self;
            };
        };

        const func = [visibilityPrefix, "function", w, ident, "()"];
        func.buildNode = function (self) {
            self.visibility = (visibility) => {
                const $visibilityPrefix = this.children[0];
                const r = $visibilityPrefix.visibility(visibility);
                return (visibility === undefined ? r : self);
            }
        };

        it('Get existing value', function () {
            let $root = parser.parse(func, "public function foo()");
            assert.equal($root.visibility(), "public");
        });
        it('Get null value', function () {
            let $root = parser.parse(func, "function foo()");
            assert.equal($root.visibility(), null);
        });
        it('Add value', function () {
            const $root = parser.parse(func, "function foo()");
            $root.visibility("private");
            assert.equal($root.text(), "private function foo()");
        });
        it('Update value', function () {
            const $root = parser.parse(func, "protected function foo()");
            $root.visibility("private");
            assert.equal($root.text(), "private function foo()");
        });
        it('Delete value', function () {
            const $root = parser.parse(func, "protected function foo()");
            $root.visibility(null);
            assert.equal($root.text(), "function foo()");
        });
    });

    describe('List', function () {
        const w = /^[ \t\r\n]+/;
        const ow = optional(w);
        const ident = /^[a-z_][\w_]*/i;
        const variable = ["$", ident];
        variable.buildNode = function (self) {
            /**
             * Get/set the variable name. This is equivalent to get/set the embedded identifier text.
             * @param {string|undefined} name
             */
            self.name = (name) => {
                const $ident = this.children[1];
                const r = $ident.text(name);
                return (name === undefined ? r : self);
            };
        };

        const argsSeparator = [ow, ",", ow];
        argsSeparator.default = ", ";
        const funcArgs = optmul(variable, argsSeparator);

        const func = ["function", w, ident, "(", funcArgs, ")"];
        func.buildNode = function (self) {
            self.getArgs = () => self.children[4].findDirectByGrammar(variable);
            self.findOneArgByName = (name => self.children[4].findOneDirectByPredicate(
                n => n.grammar === variable &&
                    n.name() === name
            ));
            self.findArgsByNameLength = (length => self.children[4].findDirectByPredicate(
                n => n.grammar === variable && n.name().length === length
            ));
            self.addArg = function($arg, $previousNode) {
                self.children[4].insert($arg, $previousNode);
                return self;
            };
            self.removeArg = function($arg) {
                self.children[4].removeWithSeparator($arg);
                return self;
            };
        };

        it('Get all items', function () {
            const $root = parser.parse(func, "function foo($b, $a, $c)");
            const $args = $root.getArgs();
            assert.equal($args.length, 3);
        });
        it('Find one item', function () {
            const $root = parser.parse(func, "function foo($b, $a, $c)");
            const $a = $root.findOneArgByName("a");
            assert.equal($a.text(), "$a");
        });
        it('Find items', function () {
            const $root = parser.parse(func, "function foo($b, $a, $c, $dd)");
            const $args = $root.findArgsByNameLength(1);
            assert.equal($args.length, 3);
        });
        it('Add item', function () {
            const $root = parser.parse(func, "function foo()");
            const $zArg = parser.parse(variable, "$z");
            $root.addArg($zArg);
            assert.equal($root.text(), "function foo($z)");
            const $aArg = parser.parse(variable, "$a");
            $root.addArg($aArg);
            assert.equal($root.text(), "function foo($a, $z)");
        });
        it('Delete item', function () {
            const $root = parser.parse(func, "function foo($z)");
            const $arg = $root.findOneArgByName("z");
            $root.removeArg($arg);
            assert.equal($root.text(), "function foo()");
        });
    });
});

