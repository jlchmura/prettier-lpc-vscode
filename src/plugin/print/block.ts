import { builders } from "prettier/doc";
import { CodeBlockNode } from "../../nodeTypes/codeBlock";
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
  return [
    "{",
    indent([hardline, join(hardline, path.map(printChildren, "children"))]),
    hardline,
    "}",
  ];
};
