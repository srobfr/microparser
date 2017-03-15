const _ = require("lodash");
const CompiledGrammar = require(__dirname + "/CompiledGrammar.js");
const Node = require(__dirname + "/Dom/Node.js");
const lexer = require(__dirname + "/Lexer/lexer.js");

const defaultOptions = {};

/**
 * Parser
 * @param options
 * @constructor
 */
function Parser(options) {
    const that = this;
    _.defaultsDeep(options, defaultOptions);

    /**
     * Builds a pseudo-DOM from the given contexts chain
     * @param chain
     * @returns {*}
     */
    that.buildDomFromContextsChain = function (chain) {
        const root = new Node();
        let node = root;
        _.each(chain, (context) => {
            if (context.cg.type === CompiledGrammar.END) {
                node = node.parent;
                return;
            }

            const n = new Node();

            // Grammar injection
            Object.defineProperty(n, 'grammar', {value: context.cg.grammar, enumerable: false, configurable: true, writable: true});
            // n.grammar = context.cg.grammar;

            // Parser injection
            Object.defineProperty(n, 'parser', {value: that, enumerable: false, configurable: true, writable: true});
            // n.parser = that;

            node.append(n);
            node = n;
            if (_.isString(context.matched)) {
                n.children.push(context.matched);
            }

            // TODO Get this right
            if (_.isFunction(decorator)) decorator(n);
        });

        const result = _.first(root.children);
        if (result) {
            result.parent = null;
            return result;
        }

        return null;
    };

    that.parse = function (grammar, code, doCheck) {
        const cg = CompiledGrammar.build(grammar);
        if (doCheck) cg.check();
        const chain = lexer.lex(cg, code);
        return that.buildDom(chain);
    };
}

module.exports = Parser;
