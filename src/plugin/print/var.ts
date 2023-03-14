import { Doc, util } from "prettier";
import { builders } from "prettier/doc";
import { TypeCastExpressionNode } from "../../nodeTypes/typeCast";
import {
  VariableDeclarationNode,
  VariableDeclaratorNode,
} from "../../nodeTypes/variableDeclaration";
import { printSuffixComments } from "./comment";
import { needsSemi, PrintNodeFunction } from "./shared";

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

export const printVarDecl: PrintNodeFunction<
  VariableDeclarationNode,
  VariableDeclarationNode
> = (node, path, options, printChildren) => {
  const { modifiers, varType, structType, declarations } = node;

  const pt1 = [];
  if (modifiers.length > 0)
    pt1.push(join(" ", path.map(printChildren, "modifiers")));
  if (varType) pt1.push(path.call(printChildren, "varType"));
  if (structType) pt1.push(path.call(printChildren, "structType"));

  const shouldPrintSemi = needsSemi(path);

  const declHasSuffixComments = node.declarations.some(
    (d) => !!d.suffixComments
  );
  const joinType = declHasSuffixComments ? [",", hardline] : [",", line];
  const pt1String = pt1.flat().join(" ") + " ";
  const printed: Doc[] = [];
  let printedDecl: Doc = group(
    join(joinType, path.map(printChildren, "declarations"))
  );

  if (declarations.length > 1) {
    printedDecl = align(pt1String.length, printedDecl);
  }
  printed.push(join(" ", [...pt1, printedDecl]));

  printed.push(printSuffixComments(node, path, options, printChildren));

  if (shouldPrintSemi) {
    printed.push(";");

    if (util.isNextLineEmpty(options.originalText, node, (n) => n.end)) {
      printed.push(hardline);
    }
  }

  return printed;
};

export const printVar: PrintNodeFunction<
  VariableDeclaratorNode,
  VariableDeclaratorNode
> = (node, path, options, printChildren) => {
  const { id, init } = node;

  const arr = [path.call(printChildren, "id")];
  if (node.suffixComments) {
    arr.push(lineSuffix([" ", path.call(printChildren, "suffixComments")]));
  }
  if (init) {
    arr.push(" =");
    const shouldIndent = init.type != "array" && init.type != "mapping";
    const printedInit = path.call(printChildren, "init");
    if (shouldIndent) {
      arr.push(group(indent([line, printedInit])));
    } else {
      arr.push(" ", printedInit);
    }
  }

  return arr;
};

export const printTypeCast: PrintNodeFunction<
  TypeCastExpressionNode,
  TypeCastExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = ["("];

  if (node.dataType) printed.push(path.call(printChildren, "dataType"));
  if (node.isArray) printed.push("*");
  printed.push(")");

  printed.push(path.call(printChildren, "exp"));

  return printed;
};
