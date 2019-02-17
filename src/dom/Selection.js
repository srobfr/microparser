const debug = require('debug')('microparser:Selection');

/**
 * Represents a nodes list
 * @param {Node[]} nodes
 * @constructor
 */
function Selection(nodes) {
    const that = this;

    /**
     * The nodes list
     * @var {Node[]}
     */
    that.nodes = nodes;

    that.get = (index => that.nodes[index]);

    Object.defineProperty(that, 'length', {
        get: function () {
            return that.nodes.length;
        }
    });

    /**
     * Iterator
     * @returns {IterableIterator<Node>}
     */
    that[Symbol.iterator] = function* () {
        for (const node of that.nodes) yield node;
    };

    /**
     * Proxified methods
     * @type {string[]}
     */
    const passEachMethods = ['text', 'clean'];
    for (const method of passEachMethods) {
        that[method] = function (...args) {
            for (const node of that.nodes) {
                node[method](...args);
            }
            return that;
        };
    }
}

module.exports = Selection;
