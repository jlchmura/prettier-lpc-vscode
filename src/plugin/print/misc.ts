import { Doc, util } from "prettier";
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
  
  printed.push(printSuffixComments(node, path, options, printChildren));
  
  printed.push(";");
  if (util.isNextLineEmpty(options.originalText, node, (n) => n.end)) {
    printed.push(hardline);
  }

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

  // fluffos only
  if (node.spread) {
    arr.push("...");
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

  const lhChar = node.surroundingChars[0];
  const rhChar = node.surroundingChars[1];

  printed.push(lhChar);

  if (node.children.length > 0) {
    const printedChildren = path.map(printChildren, "children");

    if (node.children[0].type == "struct-literal") {
      // struct literals are a special case where we don't want a comma
      // after the first child
      const arr: Doc = [];
      printedChildren.forEach((c, idx) => {
        if (idx > 1) arr.push(",");
        if (idx > 0) arr.push(line);

        arr.push(c);
      });

      printed.push(group([indent([softline, arr]), softline]));
    } else {
      printed.push(
        group([
          indent([softline, join([",", line], printedChildren)]),
          softline,
        ])
      );
    }
  }

  printed.push(rhChar);

  printed.push(printSuffixComments(node, path, options, printChildren));

  return fill(printed);
};
