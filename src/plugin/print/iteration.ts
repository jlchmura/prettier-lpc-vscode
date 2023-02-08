import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { ControlFlowStatementNode } from "../../nodeTypes/controlFlowStatement";
import { ForStatementNode } from "../../nodeTypes/forStatement";
import { WhileStatementNode } from "../../nodeTypes/whileStatement";
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

export const printWhileStatement: PrintNodeFunction<
  WhileStatementNode,
  WhileStatementNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  printed.push("while (");

  const inner = [path.call(printChildren, "test")];
  printed.push(group(indent([softline, ...inner, softline])));

  printed.push(") ");
  if (node.codeblock) {
    const printedCodeblock = path.call(printChildren, "codeblock");
    if (node.codeblock.type != "codeblock")
      printed.push(group(indent([line, printedCodeblock])));
    else printed.push([" ", printedCodeblock]);
  }

  return printed;
};

export const printForStatement: PrintNodeFunction<
  ForStatementNode,
  ForStatementNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  printed.push("for (");

  const inner: Doc = [];
  if (node.init) inner.push(path.call(printChildren, "init"));
  inner.push(";");
  //inner.push(line);
  if (node.test) inner.push(line, path.call(printChildren, "test"));
  inner.push(";");
  //inner.push(line);
  if (node.update) inner.push(line, path.call(printChildren, "update"));

  printed.push(group(indent([softline, ...inner, softline])));

  printed.push(") ");
  if (node.codeblock) {
    const pbPrinted = path.call(printChildren, "codeblock");
    if (node.codeblock.type != "codeblock") {
      printed.push(group(indent([softline, pbPrinted, softline])));
    }
  }

  return printed;
};

export const printControlFlowStatement: PrintNodeFunction<
  ControlFlowStatementNode,
  ControlFlowStatementNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [node.controlStatement || "", ";"];
  return printed;
};
