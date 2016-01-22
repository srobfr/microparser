var _ = require("lodash");

/**
 * Implémentation d'une Map
 * @constructor
 */
function Map() {
    var that = this;

    that.store = [];

    that.get = function(key) {
        var r = _.find(that.store, function(item) {
            return (item[0] === key);
        });

        return r ? r[1] : undefined;
    };

    that.set = function(key, value) {
        that.store.push([key, value]);
    };

    that.each = function(func) {
        _.each(that.store, function(v, k) {
            func(v, k);
        });
    };

    that.clone = function() {
        var newMap = new Map();
        _.each(that.store, function(item) {
            newMap.store.push(item);
        });
        return newMap;
    };
}

module.exports = Map;