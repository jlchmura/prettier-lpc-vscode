import type { Plugin, SupportOption } from "prettier";
import { ParserOptions, RequiredOptions } from "prettier";
import { locEnd, locStart, parse } from "./parser";
import { lpcPrinters } from "./printer";

export const AST_PARSER_NAME = "lpc";
export const AST_FORMAT_NAME = "lpc";

const DEFAULT_PAIR_VARS = [
  "dest_dir",
  "items",
  "search_items",
  "take_items",
  "actions",
  "sounds",
  "search_fail",
  "smells",
  "look_items",
  "contents",
  "map_offset",
];

export interface LPCOptions extends RequiredOptions, ParserOptions {
  //condenseSingleExpressionParams?: boolean;
  pairVariables?: string[];
}

export const options = {
  pairVariables: {
    since: "0.0.65",
    category: "LPC",
    type: "string",
    array: true,
    default: [{ value: DEFAULT_PAIR_VARS }],
    describe: "Array variables to print as pairs (two elements per line)",
  } as SupportOption,
  // condenseSingleExpressionParams: {
  //   since: "0.0.1",
  //   category: "LPC",
  //   type: "boolean",
  //   default: true,
  //   description:
  //     "Put array or mapping opening brackets on the same line as call-exp parens",
  // } as SupportOption,
};

export const defaultOptions: Partial<LPCOptions> = {
  tabWidth: 2,
  pairVariables: DEFAULT_PAIR_VARS,
};

export const languages: Plugin["languages"] = [
  {
    name: "lpc",
    parsers: [AST_PARSER_NAME],
    extensions: ["c"],
  },
];

export const parsers: Plugin["parsers"] = {
  lpc: {
    astFormat: AST_FORMAT_NAME,
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
