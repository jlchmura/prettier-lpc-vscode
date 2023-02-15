import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { BlankLinkNode } from "../../nodeTypes/blankLine";
import { DirectiveNode } from "../../nodeTypes/directive";
import { IdentifierNode } from "../../nodeTypes/identifier";
import { InheritNode } from "../../nodeTypes/inherit";
import { ParenBlockNode } from "../../nodeTypes/parenBlock";
import { printSuffixComments } from "./comment";
import { PrintNodeFunction, getNodeText } from "./shared";

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
  dedentToRoot,
  trim,
} = builders;

export const printInherit: PrintNodeFunction<InheritNode, InheritNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const printed: Doc = [];

  printed.push("inherit ");
  if (node.argument) printed.push(fill([path.call(printChildren, "argument")]));
  printed.push(";");

  printed.push(printSuffixComments(node, path, options, printChildren));

  return printed;
};

export const printIdentifier: PrintNodeFunction<IdentifierNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const arr: Doc[] = [];
  if (node.attributes && node.attributes["isArray"]) arr.push("*");
  arr.push(node.name || "");

  if (node.property) {
    arr.push("[", printChildren(["property"]), "]");
  }

  return arr;
};

export const printDirective: PrintNodeFunction<DirectiveNode, DirectiveNode> = (
  node,
  path,
  options,
  printChildren
) => {
  let arr: Doc[] = [];
  arr.push(node.directiveType.name || "");
  if (node.key) {
    arr.push(getNodeText(options.originalText, node.key).trim());
  }

  if (node.arguments) {
    arr.push(
      group([
        indent([
          ifBreak("\\"),
          softline,
          join([ifBreak("\\"), line], path.map(printChildren, "arguments")),
        ]),
        softline,
      ])
    );
  }

  return [trim, group(join(" ", arr))];
};

export const printBlankline: PrintNodeFunction<BlankLinkNode, BlankLinkNode> = (
  node,
  path,
  options,
  printChildren
) => {
  if (node.suffixComments)
    return [hardline, path.call(printChildren, "suffixComments")];
  else return "";
};

export const printParenBlock: PrintNodeFunction<
  ParenBlockNode,
  ParenBlockNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  printed.push("(");

  if (node.children.length > 0) {
    const printedChildren = path.map(printChildren, "children");
    printed.push(
      group([indent([softline, join([",", line], printedChildren)]), softline])
    );
  }

  printed.push(")");

  printed.push(printSuffixComments(node, path, options, printChildren));

  return fill(printed);
};
