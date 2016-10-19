# microparser [![NPM version](https://badge.fury.io/js/microparser.svg)](http://badge.fury.io/js/microparser)

> Generic text parsing library, trying to bring the javascript RegExp ease of use to the parsers world.

## Install

Using [npm](https://www.npmjs.com/) :

    npm install microparser --save

Using [yarn](https://www.npmjs.com/package/yarnpkg) :

    yarn add microparser

## Usage

    var microparser = require(__dirname + "/../microparser.js");
    var g = microparser.grammarHelper;
    
    // The code to parse.
    var code = "green, blue and red";
    
    // Grammar definition
    var color = g.tag("color", g.or("green", "blue", "red", "yellow"));
    var separator = g.or(", ", " and ");
    var grammar = g.multiple(color, separator);
    
    // Parsing
    var $root = microparser.parse(code, grammar);
    
    console.log("#### Full DOM XML ####");
    console.log($root.$.xml());    
    /* Output : 
        <?xml version="1.0"?>
        <root><color>green</color>, <color>blue</color> and <color>red</color></root>
    */
    
    console.log("\n#### Last color element value ####");
    console.log($root.find("color").last().text());
    /* Output : 
        #### Last color element value ####
        red
    */
    
A call to `microparser.parse()` returns a [Cheerio DOM](https://cheerio.js.org/) root element, which allows you to
do complex DOM querying and manipulation.

## Why microparser ?

Microparser has been created to allow a lazy developper (me!) to search-and-replace a specific value in megabytes of PHP code,
but only if this value is located in executable PHP code sections (i.e. not in commented code, the HTML blocks, etc).
 
There was no way to do this using regular expressions, because PHP scripts with HTML sections are recursive structures, 
and thus cannot be parsed correctly using regular expressions.

(By the way, If you don't agree with this statement, read [this](http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags).)

Obviously, implementing or integrating a full PHP parser would be completely overkill for this need, so I needed to
define a minimal grammar that would :
- recognize the recursive structures of the scripts (quoted strings, Heredoc, comments lines/blocks, `<?php` or `?>` blocks)
- allow to easily extract and manipulate the result
- be reusable
- could be shared with my colleagues with a minimal learning curve

## Use cases examples

- Complex search-and-replace tasks
- Massive automated code refactoring  
- Prototyping recursive formats
- Developping simple tools specific to (your own/your company) workflow / codestyle / projects structure / etc.

## Grammar

A microparser grammar is made of basic javascript objects :
- strings
- RegExps
- arrays
- Objects specifying a type, like :

    {type: "or", value: <theValue>}
    
The latter are typically created using the methods provided by the `microparser.grammarHelper` object, like this :

    var g = microparser.grammarHelper;
    console.log(g.or("foo", "bar")); // {type: "or", value: ["foo", "bar"]}
     
### Strings

A string grammar node matches the corresponding string :

    console.log(microparser.parse("foobar", "foo").xml()); // <root>foo</root>

### RegExps

A RegExp grammar node matches the remaining string:

    console.log(microparser.parse("foobar", /^foo/).xml()); // <root>foo</root>

Notice the "^" character at the beginning of the regexp. It is mandatory. 

### Arrays

An array matches a sequential suite of nodes :

    console.log(microparser.parse("foobar", ["foo", /^bar/]).xml()); // <root>foobar</root>

### or

The **or** nodes takes a list of nodes as arguments, and sequentially try to match one of them (starting at the first) :

    console.log(microparser.parse("foobar", g.or("bar", "foo")).xml()); // <root>foo</root>

### not

The **not** node takes a node as argument, and matches only if the provided node fails to match :

    console.log(microparser.parse("foobar", [g.not("bar"), "foo"]).xml()); // <root>foo</root>

Note that this node does not produce a result. It is only useful to "check" conditions in the matched code.

### test

The **test** node takes a node as argument, and matches only if the provided node matches :

    console.log(microparser.parse("foobar", [g.test("foo"), "foo"]).xml()); // <root>foo</root>

Note that this node does not produce a result. It is only useful to "check" conditions in the matched code.

### optional

The **optional** node takes a node as argument, and matches either the provided node, or an empty string :

    console.log(microparser.parse("foobar", [g.optional("bar"), "foo"]).xml()); // <root>foo</root>
    console.log(microparser.parse("foobar", [g.optional("foo"), "bar"]).xml()); // <root>foobar</root>

### multiple

The **multiple** node takes a node and an optional separator node as arguments, and tries to match this node as many 
times as possible (at least one) :

    console.log(microparser.parse("foobarbarbarbarbarbartest", ["foo", g.multiple("bar"), "test"]).xml()); // <root>foobarbarbarbarbarbartest</root>
    
With separator :

    console.log(microparser.parse("foobar,bar,bar,bar,bar,bartest", ["foo", g.multiple("bar", ","), "test"]).xml()); // <root>foobar,bar,bar,bar,bar,bartest</root>
    
Combine it with *optional* to match zero or more times :

    console.log(microparser.parse("foobar", ["foo", g.optional(g.multiple("bar"))]).xml()); // <root>foo</root>

### until

The **until** node takes a node, an optional separator node and a "next" node as arguments, and tries to match this node 
as many times as possible (at least one) until the "next" node matches the following code :

    console.log(microparser.parse("foobarbarbarbarbarbartest", ["foo", g.until(/^./, null, "test"), "test"]).xml()); // <root>foobarbarbarbarbarbartest</root>

Combine it with *optional* to match zero or more times :

    console.log(microparser.parse("foobarbarbarbarbarbartest", ["foo", g.optional(g.until(/^./, null, "test")), "test"]).xml()); // <root>foobarbarbarbarbarbartest</root>

### decorate

The **decorate** node takes a node and a decorator function as arguments and decorates the node result.

    console.log(microparser.parse("foobartest", ["foo", g.decorate("bar", function(result) { return ["(", result, ")"]; }), "test"]).xml()); // <root>foo(bar)test</root>

### tag

The **tag** node takes a tag name and a node as arguments and wraps the node result in an XML tag.

    console.log(microparser.parse("foobartest", ["foo", g.tag("b", "bar"), "test"]).xml()); // <root>foo<b>bar</b>test</root>
    
## Internals

The parsing is done in three main steps :

### Grammar compilation

The microparser grammar format uses the object nature of javascript values. In particular, javascript allows to
easily create linked-list-like structures, possibly with cycles :

    var parenthesesBlock = ["("];
    parenthesesBlock.push(parenthesesBlock);
    parenthesesBlock.push(")");
    
This (valid) microparser grammar allows to parse an infinite depth of parentheses blocks, like : "(((((((())))))))" (but infinite...).
In JS memory, this grammar involves 3 objects ("[", "]", and the `parenthesesBlock` array which contains a reference to itself).
This structure is very efficient, both in memory usage, design simplicity and parsing performances.
 
The parser starts by building an internal version of the given grammar, which will be used to recursively match the code to parse.

### Matching

Once the compiled version of the grammar is available in memory, the first offset of the code will be matched against
the grammar "entry" node, which will recursively try to match the next grammar node(s) against the rest of the string, and so on
until a terminal grammar node is reached.

When a node does not match the current code position, it will "bubble" the error to the previous nodes, until it reaches the entry node,
or a node can try to match another "path" in the grammar graph.

### Evaluation

Once the code is fully matched, the memory contains a chained list of the grammar nodes which successfully matched the code.
This list is then traversed to generate a result, using decorators functions to add XML markup on specific nodes.

The result of this traversal is a XML string.

### DOM creation

Once the resulting XML string is generated, a virtual DOM is generated and returned. To achieve this, the excellent 
[Cheerio](https://cheerio.js.org/) library is used, with some minor adaptations to help the text manipulation of the DOM nodes.  

Cheerio is inspired from the popular lib JQuery and provides a good set of DOM manipulation possibilities.

## FAQ

### I keep getting the "Syntax Error !" exception, but my grammar seems OK. What can I do ?

Conceptually, the parser finds the longest "path" in the code which matches the grammar. If your grammar is buggy, at 
some point it can take a path that you did not anticipate, and continue this way until it fails.
The syntax error will refer to the longest path which matches successfully, so it could be difficult to debug your 
grammar based on this.

If you are in this situation, I would recommend you to try smaller bits of code against the adequate subset of your grammar, 
until you find the code/grammar combination which triggers the bug. 

## Related projects

* [jison](https://www.npmjs.com/package/jison): Jison is a full-blown parser generator, using delicious [Bison grammar files](http://dinosaur.compilertools.net/bison/bison_6.html#SEC34).

## Author

**Simon Robert**

+ [github/srobfr](https://github.com/srobfr)
+ [twitter/srobfr](https://twitter.com/srobfr)

## License

Copyright © 2016 [Simon Robert](https://github.com/srobfr)
Released under the MIT license.
