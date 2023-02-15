import { Doc } from "prettier";
import { builders } from "prettier/doc";
import {
  StructDefinitionNode,
  StructLiteralNode,
} from "../../nodeTypes/struct";
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

export const printStructLiteral: PrintNodeFunction<
  StructLiteralNode,
  StructLiteralNode
> = (node, path, options, printChildren) => {
  return ["<", path.call(printChildren, "structName"), ">"];
};

export const printStructDefinition: PrintNodeFunction<
  StructDefinitionNode,
  StructDefinitionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  printed.push("struct ", path.call(printChildren, "structName"), " ");

  // this is a custom version of codeblock print that will condense to one line if possible
  path.call((childPath) => {
    const cb = childPath.getValue();
    const childPrinted = childPath.map(printChildren, "children");

    printed.push(
      "{",
      group([indent([line, join(line, childPrinted)]), line]),
      "}"
    );
  }, "definition");

  printed.push(";");

  return printed;
};
