import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { LiteralNode } from "../../nodeTypes/literal";
import { StructLiteralNode } from "../../nodeTypes/typeCast";
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

export const printStructLiteral: PrintNodeFunction<
  StructLiteralNode,
  StructLiteralNode
> = (node, path, options, printChildren) => {
  return ["<", path.call(printChildren, "structName"), ">"];
};
