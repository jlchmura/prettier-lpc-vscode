import { Doc, util } from "prettier";
import { builders } from "prettier/doc";
import { CodeBlockNode } from "../../nodeTypes/codeBlock";
import { FunctionDeclarationNode } from "../../nodeTypes/functionDeclaration";
import { ParentExpressionNode } from "../../nodeTypes/memberExpression";
import { ReturnNode } from "../../nodeTypes/returnNode";
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

export const printFunction: PrintNodeFunction<FunctionDeclarationNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const arr: Doc = [];
  const { modifiers, varType, id } = node;

  if (modifiers.length > 0)
    arr.push(join(" ", path.map(printChildren, "modifiers")), " ");
  if (varType) arr.push(path.call(printChildren, "varType"), " ");
  arr.push(path.call(printChildren, "id"));

  if (node.params.length > 0) {
    arr.push("(", group(join(", ", path.map(printChildren, "params"))), ")");
  } else {
    arr.push("()");
  }

  if (node.isStub) {
    arr.push(";");
    arr.push(printSuffixComments(node, path, options, printChildren));

    if (util.isNextLineEmpty(options.originalText, node, (n) => n?.end)) {
      arr.push(hardline);
    }
  } else {
    arr.push(" ", path.call(printChildren, "codeBlock"));
  }

  return arr;
};

export const printReturn: PrintNodeFunction<ReturnNode, ReturnNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const printed: Doc = ["return"];

  if (node.argument) {
    printed.push(" ");
    printed.push(
      group([indent([softline, path.call(printChildren, "argument"), ";"])])
    );
  } else {
    printed.push(";");
  }
  return printed;
};

export const printParentExpression: PrintNodeFunction<
  ParentExpressionNode,
  ParentExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  if (node.object) printed.push(path.call(printChildren, "object"));
  printed.push("::");
  if (node.property) printed.push(path.call(printChildren, "property"));

  return printed;
};
