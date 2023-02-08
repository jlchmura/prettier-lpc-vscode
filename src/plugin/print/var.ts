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

export const printVarDecl: PrintNodeFunction<VariableDeclarationNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const { modifiers, varType, declarations } = node;

  const pt1 = [];
  if (modifiers.length > 0) pt1.push(path.map(printChildren, "modifiers"));
  if (varType) pt1.push(path.call(printChildren, "varType"));

  const shouldPrintSemi = needsSemi(path);

  const declHasSuffixComments = node.declarations.some(
    (d) => !!d.suffixComments
  );
  const joinType = declHasSuffixComments ? [",", hardline] : [", "];
  const pt1String = pt1.flat().join(" ") + " ";
  const printed: Doc[] = [
    join(" ", [
      ...pt1,
      align(
        pt1String.length,
        join(joinType, path.map(printChildren, "declarations"))
      ),
    ]),
  ];

  if (shouldPrintSemi) {
    printed.push(";");
    
    if (util.isNextLineEmpty(options.originalText, node, n=>n.end)) {
      printed.push(hardline);
    }  
  }

  printed.push(printSuffixComments(node, path, options, printChildren));

  
  return printed;
};

export const printVar: PrintNodeFunction<
  VariableDeclaratorNode,
  VariableDeclaratorNode
> = (node, path, options, printChildren) => {
  const { id, init } = node;

  const arr = [    
    path.call(printChildren, "id")
  ];
  if (node.suffixComments) {
    arr.push(lineSuffix([" ", path.call(printChildren, "suffixComments")]));
  }
  if (init) {
    arr.push(" = ");
    arr.push(group([indent([softline, path.call(printChildren, "init")])]));
  }

  return arr;
};

export const printTypeCast: PrintNodeFunction<
  TypeCastExpressionNode,
  TypeCastExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = ["("];
  if (node.dataType) printed.push(path.call(printChildren, "dataType"));
  printed.push(")");

  printed.push(path.call(printChildren, "exp"));

  return printed;
};
