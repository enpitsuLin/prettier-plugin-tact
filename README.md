# prettier-plugin-tact

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/enpitsuLin/prettier-plugin-tact/assets/29378026/29ddc4da-fcae-448b-a446-b908af811c58">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/enpitsuLin/prettier-plugin-tact/assets/29378026/4e39e5a6-31d5-43c2-aea0-1b5b90d9bf74">
  <img src="https://github.com/enpitsuLin/prettier-plugin-tact/assets/29378026/4e39e5a6-31d5-43c2-aea0-1b5b90d9bf74" alt="LOGO" style="width:auto;">
</picture>

</div>

A [prettier plugin](https://prettier.io/docs/en/plugins.html) for automatically formatting your [tact](https://github.com/tact-lang/tact) code.

## Installation

Install both `prettier` and `prettier-plugin-tact`:

```Bash
npm install --save-dev prettier prettier-plugin-tact
// or by pnpm
pnpm add -D prettier prettier-plugin-tact
```

### Activate the plugin

Create or modify your [prettier configuration file](https://prettier.io/docs/en/configuration) to activate the plugin:

```json
{
  "plugins": ["prettier-plugin-tact"]
}
```

## Usage

### If you installed prettier as a local dependency, you can add prettier as a script in your package.json,

```json
{
  "scripts": {
    "prettier": "prettier"
  }
}
```

Run prettier for your contracts files by command or you can add this to you script if you prefer:

```Bash
npm run prettier -- path/to/file.tact --write
# or
pnpm prettier path/to/file.tact --write
```

> Prettier only works with valid code. If there is a syntax error, nothing will be done and a parser error will be thrown.

### Notice

Before [`tree-sitter-tact` be publishing to npm registry](https://github.com/tact-lang/tree-sitter-tact/issues/12), you should install `tree-sitter-tact` from GitHub repo by:

```sh
npm install -D https://github.com/tact-lang/tree-sitter-tact
```

## License

Distributed under the MIT license. See [LICENSE](LICENSE) for more information.
