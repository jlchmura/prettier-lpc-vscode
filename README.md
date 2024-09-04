# prettier-lpc-vscode
VSCode extension to format LPC (Lars Pensjö C) files with [Prettier](https://prettier.io/). It is written mainly for the [LDMud](http://www.ldmud.eu/) flavor of LPC, but includes support for most FluffOS syntax as well.

### WARNING 
This extension should still be considered an early release. **It may break your code**. Use at your own risk.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Installation
Install from the VS Code Marketplace: [prettier-lpc-vscode](https://marketplace.visualstudio.com/items?itemName=jlchmura.prettier-lpc-vscode)

## Configuration

This plugin, like Prettier, is
[opinionated](https://prettier.io/docs/en/option-philosophy.html). The plugin honors standard prettier config options which 
can be set via a [`.prettierrc` file](https://prettier.io/docs/en/configuration.html). In particular, the following
options may be of interest to LPC developers:

| API Option           | Description                                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| `printWidth`         | [Same option as in Prettier](https://prettier.io/docs/en/options.html#print-width) |
| `tabWidth`           | [Same option as in Prettier](https://prettier.io/docs/en/options.html#tab-width)   |
| `useTabs`            | [Same option as in Prettier](https://prettier.io/docs/en/options.html#tabs)        |
| `pairVariables`      | See [Pair Arrays](#pair-arrays) |

## Multi-Line Objects

For arrays and functions, this plugin follow's prettier's [multi-line objects rule](https://prettier.io/docs/en/rationale.html#multi-line-objects). For tips on how to control whether objects
are collapsed to a single line, or not, see: https://prettier.io/docs/en/rationale.html#multi-line-objects

## Pair Arrays
In LDMud flavors of LPC there are often arrays that are treated as _pairs_. A common example of this is `dest_dir`. For example:
```
dest_dir = ({
  "room/pub", "west",
  "room/street1", "east",
});
```
By default, this plugin is set to identify a list of common variable names for which arrays should be formatted in _pair_ mode as shown above. This list can be customized (or set to an empty array to completely disable this feature) by using the `pairVariables` setting.

An array can also be forced into pair mode by utilizing the `@prettier-pair` hint:
```
// @prettier-pair
string *pairs = ({
  "key 1", "value 1",
  "key 2", "value 2",
});
```
## If you love this extension, you could

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >](https://www.buymeacoffee.com/jlchmura)

## Known Limitations
The folowing languages features are not supported yet:
- Lambda parsing works, but is untested. Use extra caution.
- Union types
- Coroutines 
- LWobjects

## To-Do
- Support for remaining language features/syntax
- Split AST parsing into separate package
- Split prettier plugin portion into separate package
- Add more options for customization

## Other useful LPC tools

Also check out the [LPC Language Services](https://marketplace.visualstudio.com/items?itemName=jlchmura.lpc) extension.