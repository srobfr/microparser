var util = require("util");
var _ = require("lodash");
var microparser = require(__dirname + "/../microparser.js");
var g = microparser.grammarHelper;
var $ = microparser.$;

// Grammaire
var w = /^[\s\t\r\n]+/;

var name = g.tag("name", /^\w+/);
var surname = g.tag("surname", "Robert");
var email = g.tag("email", /^.+?@.+?\.\w+/);

var afterName = [w, surname, w, "<", email, ">"];
var names = g.until(name, w, afterName);

var grammar = g.tag("root", [
    names, afterName,
    /^$/
]);

var code = "Simon Foo Robert <srob+foo@srob.fr>";

// Parsing
var $root = microparser.parse(code, grammar);

// Dump root DOM element
console.log($.xml($root));

