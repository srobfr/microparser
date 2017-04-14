const _ = require("lodash");
const CompiledGrammar = require(__dirname + "/CompiledGrammar.js");
const Node = require(__dirname + "/Dom/Node.js");
const lexer = require(__dirname + "/Lexer/lexer.js");
const defaultLogic = require(__dirname + "/Dom/defaultLogic.js");

/**
 * Parser
 * @param options
 * @constructor
 */
function Parser(options) {
    const that = this;
    options = options ||
        {
            // Timeout on the lexer execution, in ms.
            lexerTimeout: 5000
        };

    const defaultOptions = {
        checkGrammar: false,
        nodeDecorator: defaultLogic.decorator,
        getDefaultCodeFromGrammar: defaultLogic.getDefaultCodeFromGrammar
    };

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

            // Decorate the node for specific logic
            if (_.isFunction(options.nodeDecorator)) options.nodeDecorator(n);

            // And apply the grammar-specific logic, if any.
            if (_.isFunction(node.grammar.decorator)) node.grammar.decorator(n);
        });

        const result = _.first(root.children);
        if (result) {
            result.parent = null;
            return result;
        }

        return null;
    };

    that.parse = function (grammar, code) {
        if (code === undefined || code === null) code = options.getDefaultCodeFromGrammar(grammar);
        const cg = CompiledGrammar.build(grammar);
        if (options.checkGrammar) cg.check();
        const chain = lexer.lex(cg, code, options.lexerTimeout);
        return that.buildDomFromContextsChain(chain);
    };
}

module.exports = Parser;
