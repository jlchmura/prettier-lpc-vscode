import {
  AstPath,
  Doc,
  Parser,
  ParserOptions,
  Printer,
  RequiredOptions,
} from "prettier";
import { builders } from "prettier/doc";
import { LPCOptions } from ".";
import { LPCNode } from "../nodeTypes/lpcNode";
import { LPCParser } from "../parser/lpcParser";


export const locStart = (node: LPCNode) => node.start;
    export const locEnd =  (node:LPCNode) => node.end;
    export const parse = (
      text: string,
      parsers: { [parserName: string]: Parser },
      options: LPCOptions
    ): LPCNode => {
      const parse = new LPCParser();
      const doc = parse.parse(text);
      const nd = new LPCNode(0, text.length-1, doc.roots, void 0) ;
      nd.type = "root";
      return nd;
    }