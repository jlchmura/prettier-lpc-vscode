import { Doc, util } from "prettier";
import { builders } from "prettier/doc";
import { CodeBlockNode } from "../../nodeTypes/codeBlock";
import { printSuffixComments } from "./comment";
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

export const printCodeblock: PrintNodeFunction<CodeBlockNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const sep =
    options.condenseSingleStatementFunctions && node.children.length <= 1
      ? line
      : hardline;
  const printed: Doc = [
    "{",
    group([indent([sep, join(sep, path.map(printChildren, "children"))]), sep]),
    "}",
  ];
  printed.push(printSuffixComments(node, path, options, printChildren));

  return printed;
};
