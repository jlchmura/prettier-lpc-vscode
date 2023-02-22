# prettier-lpc-vscode
VSCode extension to format LPC (Lars Pensjö C) files with [Prettier](https://prettier.io/). It is written mainly for the [LDMud](http://www.ldmud.eu/) flavor of LPC, though it may work for others as well.

### WARNING 
This extension is a very early release. **It may break your code**. Use at your own risk.

## Installation
Install from the VS Code Marketplace: [prettier-lpc-vscode](https://marketplace.visualstudio.com/items?itemName=jlchmura.prettier-lpc-vscode)

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
