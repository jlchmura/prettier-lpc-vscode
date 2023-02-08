import { Doc } from "prettier";
import { builders } from "prettier/doc";
import {
  ClosureNode,
  InlineClosureArgumentNode,
  InlineClosureNode,
  LambdaEmptyArgNode,
} from "../../nodeTypes/closure";
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

export const printInlineClosure: PrintNodeFunction<
  InlineClosureNode,
  InlineClosureNode
> = (node, path, options, printChildren) => {
  const printedChildren: Doc = path.map(printChildren, "children");

  return group([
    "(:",
    indent([line, join([" ", line], printedChildren)]),
    line,
    ":)",
  ]);
};

export const printInlineClosureArg: PrintNodeFunction<
  InlineClosureArgumentNode,
  InlineClosureArgumentNode
> = (node, path, options, printChildren) => {
  return node.name;
};

export const printLambdaEmptyArg: PrintNodeFunction<
  LambdaEmptyArgNode,
  LambdaEmptyArgNode
> = (node, path, options, printChildren) => {
  return "'o";
};
