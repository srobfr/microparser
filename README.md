# microparser [![NPM version](https://badge.fury.io/js/microparser.svg)](http://badge.fury.io/js/microparser)

> Generic parsing library, designed to do real parsing with the ease of use of regular expressions.

## Install

Install with [npm](https://www.npmjs.com/)

    npm i microparser --save

## Usage

    var microparser = require('microparser');
    var g = microparser.xmlGrammar;
    
    var code = "green, blue and red";
    
    // Grammar definition
    var color = g.tag("color", g.or("green", "blue", "red", "yellow"));
    var separator = g.or(", ", " and ");
    var grammar = g.multiple(color, separator);
    
    // Parsing
    var xml = g.parse(code, grammar);
    console.log(xml);

The above code will produce :

    <?xml version="1.0"?>
    <root><color>green</color>, <color>blue</color> and <color>red</color></root>
    
Then you can load, query and manipulate this xml code with other projects like [cheerio](https://www.npmjs.com/package/cheerio).

This example is obviously trivial and could be replaced by a simple regex. You can find more complex examples in the `examples/`
folder.

## Why use Microparser ?

You cannot use regexs to parse nested structures and writing BNF grammars is overkill for your little tool-project.

(No, you can't use regex to parse nested structure ! Do not even try ! Ok, read [this](http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags).)  

## FAQ

### So you parse come code, generate xml and then parse this xml. WTF ?

Ok, this sounds complicated. But :

* XML can be easily parsed into a DOM using various existing libraries. I needed to 
manipulate the code, and DOM is the best thing I know to manipulate structured text.
* XML can be used with every possible languages, so you could use this tool even if your whole stack is coded in [Assembler](http://tibleiz.net/asm-xml/).
* Producing any other output format should be an easy task. Internally, your grammar object is converted in an 
oriented graph which is used by the parser to optimise the parsing. `xmlGrammar` is currently the only available 
grammar converter, but creating another converter should be easy.
* Microparser was designed to be easy to use and integrate in existing tools. It is not optimized for performance, will 
probably crash on some specific codes or grammars, and/or take years to parse a 10MB file. Do not use it in production.

### I keep getting the "Syntax Error !" exception, but my grammar seems OK. What can I do ?

Conceptually, the parser finds the longest "path" which matches the grammar in the code. If your grammar is buggy, at 
some point it can take a path that you did not anticipate, and continue this way until it fails.
The syntax error will refer to the longest path which matches successfully, so it can be not-so-usefull to debug your grammar.

If you are in this situation, I would recommend you to try smaller bits of code against the adequate subset of your grammar, 
until you find the code/grammar combination which triggers the bug. 

## Related projects

* [jison](https://www.npmjs.com/package/jison): A parser generator with Bison's API. Has better perfs, tests and support
than microparser, but needs things which you may not want to write, like BNF grammars.

## Author

**Simon Robert**

+ [github/srobfr](https://github.com/srobfr)
+ [twitter/srobfr](https://twitter.com/srobfr)

## License

Copyright © 2016 [Simon Robert](https://github.com/srobfr)
Released under the MIT license.
