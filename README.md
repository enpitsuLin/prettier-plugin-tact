# prettier-plugin-tact

A [prettier plugin](https://prettier.io/docs/en/plugins.html) for automatically formatting your [tact](https://github.com/tact-lang/tact) code.

## Installation and usage

Install both `prettier` and `prettier-plugin-tact`:

```Bash
npm install --save-dev prettier prettier-plugin-tact
```

Run prettier in your contracts:

```Bash
npx prettier --write --plugin=prettier-plugin-tact 'contracts/**/*.tact'
```

You can add a script for running prettier on all your contracts:

```
"prettier": "prettier --write --plugin=prettier-plugin-tact 'contracts/**/*.sol'"
```

Or you can use it as part of your linting to check that all your code is prettified:

```
"lint": "prettier --list-different --plugin=prettier-plugin-tact 'contracts/**/*.sol'"
```

> Prettier only works with valid code. If there is a syntax error, nothing will be done and a parser error will be thrown.

## License

Distributed under the MIT license. See [LICENSE](LICENSE) for more information.
