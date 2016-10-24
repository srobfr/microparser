var cheerio = require("cheerio");
var $ = require(__dirname + "/../mp-cheerio.js");

// var microparser = require(__dirname + "/../microparser.js");
// var g = microparser.grammarHelper;

var xml = `<foo>
<test1>test1</test1>
Intertexte
<bar/>
post-bar
</foo>`;

var count = 10000;

function processCheerio() {
    var $ = cheerio.load(xml, {xmlMode: true});
    var $bar = $(">bar");

    // $bar.removePreviousText();
    $bar.before("Meh.\n");
    $bar.text("test");
}

// Cheerio classique
var start = new Date().getTime();
for(var i = 0; i < count; i++) {
    processCheerio();
}
console.log("cheerio:", new Date().getTime() - start);

// mp-cheerio
function processMpCheerio() {
    var $foo = $(xml);
    var $bar = $foo.find(">bar");
// console.log($.xml($bar));
//     $bar.removePreviousText();
    $bar.before("Meh.\n");
    $bar.text("test");
}

var start = new Date().getTime();
for(var i = 0; i < count; i++) {
    processMpCheerio();
}
console.log("mp-cheerio:", new Date().getTime() - start);

console.log($("foo").length);
