# microparser [![NPM version](https://badge.fury.io/js/microparser.svg)](http://badge.fury.io/js/microparser)

> Generic text parsing library.

## Install

Using [npm](https://www.npmjs.com/) :

    npm install microparser --save

Using [yarn](https://www.npmjs.com/package/yarnpkg) :

    yarn add microparser

## Usage

    const microparser = require("microparser");

    const Parser = microparser.Parser;
    const {multiple, not, optional, optmul, or} = microparser.grammarHelpers;
    const parser = new Parser();

    // The code to parse.
    const code = "green, blue and red";

    // Grammar definition
    const color = or("green", "blue", "red", "yellow");
    const separator = g.or(", ", " and ");
    const grammar = multiple(color, separator);

    // Parsing
    const $ = parser.parse(grammar, code);

    console.log("\n#### Last color element value ####");
    console.log($.children[0].text());
    /* Output :
        #### Last color element value ####
        red
    */

A call to `parser.parse()` returns a (pseudo) DOM node, which allows you to do complex querying and manipulations.

See the `tests/examples` content for more complex examples.

## Author

**Simon Robert**

+ [github/srobfr](https://github.com/srobfr)
+ [twitter/srobfr](https://twitter.com/srobfr)

## License

Copyright © [Simon Robert](https://github.com/srobfr)

Released under the MIT license.
