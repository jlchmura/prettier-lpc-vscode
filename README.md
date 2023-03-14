# prettier-lpc-vscode
VSCode extension to format LPC (Lars Pensjö C) files with [Prettier](https://prettier.io/). It is written mainly for the [LDMud](http://www.ldmud.eu/) flavor of LPC, but includes preliminary support for FluffOS as well.

### WARNING 
This extension is a very early release. **It may break your code**. Use at your own risk.

## Installation
Install from the VS Code Marketplace: [prettier-lpc-vscode](https://marketplace.visualstudio.com/items?itemName=jlchmura.prettier-lpc-vscode)

## Configuration

This plugin, like Prettier, is
[opinionated](https://prettier.io/docs/en/option-philosophy.html). The plugin honors standard prettier config options which 
can be set via a [`.prettierrc` file](https://prettier.io/docs/en/configuration.html). In particular, the following
options may be of interest to LPC developers:

| API Option           | Default | Description                                                                        |
| -------------------- | ------- | ---------------------------------------------------------------------------------- |
| `printWidth`         |         | [Same option as in Prettier](https://prettier.io/docs/en/options.html#print-width) |
| `tabWidth`           |         | [Same option as in Prettier](https://prettier.io/docs/en/options.html#tab-width)   |
| `useTabs`            |         | [Same option as in Prettier](https://prettier.io/docs/en/options.html#tabs)        |

## Multi-Line Objects

For arrays and functions, this plugin follow's prettier's [multi-line objects rule](https://prettier.io/docs/en/rationale.html#multi-line-objects). For tips on how to control whether objects
are collapsed to a single line, or not, see: https://prettier.io/docs/en/rationale.html#multi-line-objects

## Known Limitations
The folowing languages features are not supported yet:
- Lambda parsing works, but is untested. Use extra caution.
- Union types
- Coroutines 

## To-Do
- Support for remaining language features/syntax
- Split AST parsing into separate package
- Split prettier plugin portion into separate package
- Add more options for customization
- Add unit tests
