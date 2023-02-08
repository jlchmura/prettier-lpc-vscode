import { builders } from "prettier/doc";
import { ClosureNode } from "../../nodeTypes/closure";
import { PrintNodeFunction } from "./shared";

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

export const printClosure: PrintNodeFunction<ClosureNode, ClosureNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const printedArg = path.call(printChildren, "argument");
  return ["#'", printedArg];
};
