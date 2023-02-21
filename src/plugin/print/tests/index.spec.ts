import * as prettierPlugin from "../.."
import * as prettier from "prettier";
import { LPCParser, ParseLPC } from "../../../parser/lpcParser";

describe("prettier-lpc plugin", () => {
  const format = (input: string, options?: prettier.Options) => {
    const formatted = prettier.format(input, {
      parser: prettierPlugin.AST_PARSER_NAME,
      plugins: [prettierPlugin],
      printWidth: 150,
      tabWidth: 2,
      useTabs: false,
      ...options,
    });

    // always validating that the result of formatting is backward compatible with JSONata
    expect(() => ParseLPC(formatted)).not.toThrow();
    return formatted;
  };

  test("test",()=>{
    expect(()=>true).toBeTruthy();
  });
})