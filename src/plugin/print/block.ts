import { Doc, util } from "prettier";
import { builders } from "prettier/doc";
import { CodeBlockNode } from "../../nodeTypes/codeBlock";
import { first, last } from "../../utils/arrays";
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

export const printCodeblock: PrintNodeFunction<CodeBlockNode, CodeBlockNode> = (
  node,
  path,
  options,
  printChildren
) => {
  // if there is no newline in the codeblock, try to condense it to one line
  const tryCondense = !util.hasNewlineInRange(
    options.originalText,
    node.start,
    first(node.children)?.end || node.end
  );

  const sep =
    tryCondense &&
    node.children.length <= 1 &&
    // don't collapse single-line if consequents
    path.match(
      () => true,
      (n) => n.type != "if"
    )
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
