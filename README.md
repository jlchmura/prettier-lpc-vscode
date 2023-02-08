# prettier-lpc-vscode
VSCode extension to format LPC (Lars Pensjö C) files with [Prettier](https://prettier.io/). It is written mainly for the [LDMud](http://www.ldmud.eu/) flavor of LPC, though it may work for others as well.

### WARNING 
This extension is a very early release. **It make break your code**. Use at your own risk.

## Known Limitations
The folowing languages features are not supported yet:
- Closures
- Lambdas
- Structs
- Coroutines 

## To-Do
- Support for remaining language features/syntax
- Split AST parsing into separate package
- Split prettier plugin portion into separate package
- Add more options for customization
- Add unit tests