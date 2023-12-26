import { AstPath, Doc } from "prettier";
import { builders } from "prettier/doc";
import {
  CommentBlockNode,
  CommentNode,
  InlineCommentNode,
} from "../../nodeTypes/comment";
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
  const extraLines: string[] = [];

  if (node.body) {
    let comStr = (node.body || "").trim();
    comStr = comStr.substring(2); // remove opening /*
    comStr = comStr.substring(0, comStr.length - 3); //remove closing */
    const lines = comStr.split("\n");

    printed.push("/*");
    let hasTextCnt = 0;

    let lineSep = "";
    const isFormated = lines.every((l, lIdx) => {
      return lIdx == 0 || lIdx == lines.length - 1 || l.startsWith(" *");
    });

    lines.forEach((l, lIdx) => {
      if (!isFormated) {
        if (lIdx == 0) printed.push(" ");

        lineSep = " * ";
        l = l.trim();

        // anythign over 4 stars we'll consider a headline and leave
        if (!l.startsWith("****")) {
          while (l.startsWith("*")) l = l.substring(1).trim();
        }
      }
      if (l.length > 0) hasTextCnt++;

      extraLines.push(l);
    });

    if (hasTextCnt == 1) {
      // collapse to single line
      printed.push(...extraLines);
    } else {
      // use multi-line
      extraLines.forEach((el, idx) => {
        if (idx == extraLines.length - 1 && el.trim().length == 0)
          printed.push(hardline);
        else if (idx > 0) {
          printed.push([hardline, lineSep]);
        }

        printed.push(el);
      });
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

/**
 * Gets the comment node directly before the current node, wherever that may be in the path.
 * @param path current path
 * @returns the comment node, or undefined if there is none
 */
export function getPreviousComment(
  path: AstPath<LPCNode>
): CommentNode | undefined {
  let codeBlock = undefined;
  let prevNode = undefined;

  let n: LPCNode | null;
  let i = 0;
  while (!!(n = path.getParentNode(i++)) && !codeBlock) {
    if (n.type == "codeblock" || n.type == "root") {
      codeBlock = n;
      prevNode = path.getParentNode(i - 2);
    }
  }

  if (!!codeBlock) {
    const possibleComment = codeBlock.findNodeBefore(prevNode?.start || 0);
    switch (possibleComment?.type) {
      case "comment":
      case "comment-singleline":
      case "comment-block":
        return possibleComment as CommentNode;
    }
  }

  return undefined;
}
