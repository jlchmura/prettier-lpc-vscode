import type { Plugin, SupportOption } from "prettier";
import { ParserOptions, RequiredOptions } from "prettier";
import { locEnd, locStart, parse } from "./parser";
import { lpcPrinters } from "./printer";

export interface LPCOptions extends RequiredOptions, ParserOptions {
  condenseSingleExpressionParams?: boolean;
  condenseSingleStatementFunctions?: boolean;
}

export const options = {
  condenseSingleExpressionParams: {
    since: "0.0.1",
    category: "LPC",
    type: "boolean",
    default: true,
    description:
      "Put array or mapping opening brackets on the same line as call-exp parens",
  } as SupportOption,
  condenseSingleStatementFunctions: {
    since: "0.0.20",
    category: "LPC",
    type: "boolean",
    default: true,
    description:
      "Condense single statement function bodies onto a single line, if possible.",
  } as SupportOption,
};

export const defaultOptions: Partial<LPCOptions> = {
  tabWidth: 2,
  condenseSingleExpressionParams: true,
  condenseSingleStatementFunctions: true,
};

export const languages: Plugin["languages"] = [
  {
    name: "lpc",
    parsers: ["lpc"],
    extensions: ["c"],
  },
];

export const parsers: Plugin["parsers"] = {
  lpc: {
    astFormat: "lpc",
    parse: parse,
    locStart: locStart,
    locEnd: locEnd,
  },
};
export const printers: Plugin["printers"] = lpcPrinters;

const plugin: Plugin = {
  languages,
  parsers,
  printers,
  options,
  defaultOptions,
};

export default plugin;
