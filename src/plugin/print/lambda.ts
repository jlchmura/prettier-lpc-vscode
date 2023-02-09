import { Doc, util } from "prettier";
import { builders } from "prettier/doc";
import {
  LambdaEmptyArgNode,
  LambdaIndexorNode,
  LambdaNode,
} from "../../nodeTypes/lambda";
import { getNodeText, needsSemi, PrintNodeFunction } from "./shared";

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

export const printLambdaEmptyArg: PrintNodeFunction<
  LambdaEmptyArgNode,
  LambdaEmptyArgNode
> = (node, path, options, printChildren) => {
  return "'o";
};

export const printLambda: PrintNodeFunction<LambdaNode, LambdaNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const printed: Doc = ["lambda("];
  const printedArg = path.call(printChildren, "arguments");
  const printedCode = path.call(printChildren, "code");

  printed.push(
    group([indent([softline, printedArg, ",", line, printedCode]), softline])
  );

  if (needsSemi(path)) {
    printed.push(";");

    if (util.isNextLineEmpty(options.originalText, node, (n) => n.end)) {
      printed.push(hardline);
    }
  }

  return printed;
};

export const printLambdaIndexor: PrintNodeFunction<
  LambdaIndexorNode,
  LambdaIndexorNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [getNodeText(options.originalText, node)];
  return printed;
};
