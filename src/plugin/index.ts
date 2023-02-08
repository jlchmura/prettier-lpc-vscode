import type { Plugin, SupportOption } from "prettier";
import {
  AstPath,
  Doc,
  Parser,
  ParserOptions,
  Printer,
  RequiredOptions,
} from "prettier";
import {  locEnd, locStart, parse } from "./parser";
import { lpcPrinters } from "./printer";

export interface LPCOptions extends RequiredOptions, ParserOptions {  
  condenseSingleExpressionParams?: boolean
}

export const options = {
  condenseSingleExpressionParams: {
    since: "0.0.1",
    category: "LPC",
    type: "boolean",
    default: true,
    description: "Put array or mapping opening brackets on the same line as call-exp parens"
  } as SupportOption
}

export const defaultOptions = {
  tabWidth: 2,
  condenseSingleExpressionParams: true
};

export const languages: Plugin["languages"] = [
  {
    name: "lpc",
    parsers: ["lpc"],
    extensions: ["c"]
  },
];

export const parsers: Plugin["parsers"] = {
  lpc: {
    astFormat: "lpc",
    parse: parse,
    locStart: locStart,
    locEnd: locEnd    
  }
};
export const printers: Plugin["printers"] = lpcPrinters;

const plugin: Plugin = {
  languages,
  parsers,
  printers,
  options,
  defaultOptions
};

export default plugin;