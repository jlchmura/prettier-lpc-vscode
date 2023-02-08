import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { AssignmentExpressionNode } from "../../nodeTypes/assignmentExpression";
import { BinaryExpressionNode } from "../../nodeTypes/binaryExpression";
import { CallExpressionNode } from "../../nodeTypes/callExpression";
import { LogicalExpressionNode } from "../../nodeTypes/logicalExpression";
import { MemberExpressionNode } from "../../nodeTypes/memberExpression";
import { UnaryPrefixExpressionNode } from "../../nodeTypes/unaryPrefixExpression";
import { pushIfVal } from "../../utils/arrays";
import { printSuffixComments } from "./comment";
import { PrintNodeFunction, needsSemi } from "./shared";

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

export const printUnaryPrefixExpression: PrintNodeFunction<
  UnaryPrefixExpressionNode,
  UnaryPrefixExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  if (node.operator) printed.push(node.operator);
  if (node.operand) printed.push(path.call(printChildren, "operand"));

  return printed;
};

export const printCallExpression: PrintNodeFunction<
  CallExpressionNode,
  CallExpressionNode
> = (node, path, options, printChildren) => {  
  const printed = [path.call(printChildren, "callee")];
  const sym = Symbol("argGroup");
  printed.push("(");
  if (node.arguments && node.arguments.length > 0) {
    const arg0 = node.arguments[0];
    const argPrinted = join([",", line], path.map(printChildren, "arguments"));
    if (
      options.condenseSingleExpressionParams &&
      node.arguments.length == 1 &&
      (arg0.type == "array" || arg0.type == "mapping")
    ) {
      // don't indent these
      printed.push(argPrinted);
    } else {
      printed.push(group([indent([softline, argPrinted])], { id: sym }));
    }
  }

  printed.push(ifBreak(softline, "", { groupId: sym }), ")");

  printed.push(printSuffixComments(node, path, options, printChildren));

  const shouldPrintSemi = needsSemi(path);
  if (shouldPrintSemi) printed.push(";");

  return fill(printed);
};

export const printAssignmentExpression: PrintNodeFunction<
  AssignmentExpressionNode,
  AssignmentExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  if (node.left) printed.push(path.call(printChildren, "left"));

  if (node.operator != "++" && node.operator != "--") printed.push(" ");
  printed.push(node.operator || "");

  if (node.right) {
    const shouldIndent =
      node.right?.type != "array" && node.right?.type != "mapping";
    const rightPrinted = path.call(printChildren, "right");

    if (shouldIndent) {
      printed.push(group(indent([line, rightPrinted])));
    } else {
      printed.push(" ", rightPrinted);
    }
  }

  const printSemi = needsSemi(path);
  if (printSemi) printed.push(";");

  pushIfVal(printed, printSuffixComments(node, path, options, printChildren));

  return printed;
};

export const printBinaryExpression: PrintNodeFunction<
  BinaryExpressionNode,
  BinaryExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  if (node.left) printed.push(path.call(printChildren, "left"));
  printed.push(" ", node.operator || "");

  const isNestedExp = path.match(
    (n) => n.type == "binary-exp",
    (n) => n.type == "binary-exp"
  );

  // if this returns to an assignment-exp
  // or if this is the only binary exp in an call-exp or array member
  // then indentation is not needed
  const skipIndent = path.match(
    (n) => n.type == "binary-exp",
    (n, nm, idx) =>
      n.type == "assignment-exp" ||
      (!!nm && Array.isArray(n[nm]) && n[nm].length == 1)
  );

  if (node.right) {
    const rightPrinted = [line, path.call(printChildren, "right")];
    if (isNestedExp || skipIndent) {
      printed.push(rightPrinted);
    } else {
      printed.push(indent(rightPrinted));
    }
  }

  return printed;
};

export const printLogicalExpression: PrintNodeFunction<
  LogicalExpressionNode,
  LogicalExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  const printedLeft: Doc[] = [];

  if (node.left) printedLeft.push(path.call(printChildren, "left"));
  printedLeft.push(" ", node.operator || "");
  printed.push(group(printedLeft));

  if (node.right) {
    const rightPrinted = [line, group([path.call(printChildren, "right")])];
    printed.push(rightPrinted);
  }

  return group(printed);
};

export const printMemberExpression: PrintNodeFunction<
  MemberExpressionNode,
  MemberExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  if (node.object) printed.push(path.call(printChildren, "object"));
  if (node.property?.type == "indexor-exp") {
    printed.push(
      "[",
      group([softline, path.call(printChildren, "property"), softline]),
      "]"
    );
  } else {
    if (node.object) printed.push("->");
    if (node.property) printed.push(path.call(printChildren, "property"));
  }

  if (node.arguments) {
    const printedArgs = path.map(printChildren, "arguments");
    printed.push(join([",", line], printedArgs));
  }

  if (needsSemi(path)) {
    printed.push(";");
  }

  printed.push(printSuffixComments(node, path, options, printChildren));

  return printed;
};
