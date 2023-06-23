import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { LiteralNode, StringLiteralBlockNode } from "../../nodeTypes/literal";
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
  literallineWithoutBreakParent,
  hardlineWithoutBreakParent,
  indentIfBreak,
  ifBreak,
  lineSuffix,

  dedentToRoot,
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

export const printStringLiteralBlock: PrintNodeFunction<
  StringLiteralBlockNode,
  StringLiteralBlockNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  let { marker, body } = node;

  printed.push(marker || "");
  printed.push(hardlineWithoutBreakParent);

  let trimmedMarker = marker || "";
  while (trimmedMarker.startsWith("@")) {
    trimmedMarker = trimmedMarker.substring(1);
  }

  // drop first newline.. hardlineWithoutBreakParent adds it for us
  if (body && body.substring(0, 1) == "\n") body = body.substring(1);

  printed.push(dedentToRoot([body || "", hardline, trimmedMarker]));
  printed.push(printSuffixComments(node, path, options, printChildren));
  printed.push(hardline);

  return printed;
};
