import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { LiteralNode } from "../../nodeTypes/literal";
import { printSuffixComments } from "./comment";
import { getNodeText, PrintNodeFunction } from "./shared";


const {
  group,
  indent,
  markAsRoot,
  align,
  dedent,
  join,
  line,
  hardline,
  breakParent,
  softline,
  fill,
  indentIfBreak,
  ifBreak,
  lineSuffix,
} = builders;


export const printLiteral: PrintNodeFunction<LiteralNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const printed: Doc = [];
  printed.push(getNodeText(options.originalText, node).trim());
  printed.push(printSuffixComments(node, path, options, printChildren));
  return printed;
};