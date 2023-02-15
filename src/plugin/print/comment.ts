import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { InlineCommentNode, CommentBlockNode } from "../../nodeTypes/comment";
import { LPCNode } from "../../nodeTypes/lpcNode";
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

export const printInlineComment: PrintNodeFunction<
  InlineCommentNode,
  InlineCommentNode
> = (node, path, options, printChildren) => {
  const printed: Doc = ["// ", node.body || "", breakParent];
  return printed;
};

export const printCommentBlock: PrintNodeFunction<
  CommentBlockNode,
  CommentBlockNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  const extraLines: Doc = [];

  if (node.body) {
    let comStr = (node.body || "").trim();
    comStr = comStr.substring(2); // remove opening /*
    comStr = comStr.substring(0, comStr.length - 3); //remove closing */
    const lines = comStr.split("\n");

    printed.push("/* ");
    let hasTextCnt = 0;
    lines.forEach((l, lIdx) => {
      l = l.trim();
      while (l.startsWith("*")) l = l.substring(1).trim();
      if (l.length > 0) hasTextCnt++;
      extraLines.push(l);
    });

    if (hasTextCnt == 1) {
      // collapse to single line
      printed.push(...extraLines);
    } else {
      // use multi-line
      printed.push(join([hardline, " * "], extraLines));
      printed.push(hardline);
    }
  }

  printed.push(" */");

  return printed;
};

export const printSuffixComments: PrintNodeFunction<LPCNode, LPCNode> = (
  node,
  path,
  options,
  printChildren
) => {
  if (node.suffixComments)
    return [
      lineSuffix([" ", path.call(printChildren, "suffixComments")]),
      breakParent,
    ];
  else return [];
};
