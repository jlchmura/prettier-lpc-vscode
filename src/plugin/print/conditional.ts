import { Doc } from "prettier";
import { builders } from "prettier/doc";
import { IfNode } from "../../nodeTypes/if";
import { ParenBlockNode } from "../../nodeTypes/parenBlock";
import { SwitchNode } from "../../nodeTypes/switch";
import { TernaryExpressionNode } from "../../nodeTypes/ternaryExpression";
import { last } from "../../utils/arrays";
import { printCommentBlock } from "./comment";
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

export const printSwitch: PrintNodeFunction<SwitchNode, SwitchNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const printed: Doc = [];

  printed.push("switch ");
  printed.push(
    group([indent([softline, path.call(printChildren, "test")]), softline])
  );
  printed.push(" {");

  const cases: Doc = [];
  const lastStatement = last(node.cases);
  path.each((casePath) => {
    const c = casePath.getNode();

    const isLast = c == lastStatement;
    if (c?.type.startsWith("comment")) {
      cases.push(printChildren(casePath), hardline);
      return;
    }

    cases.push("case ", casePath.call(printChildren, "expression"), ":");

    casePath.call((childPath) => {
      const childrenPrinted = childPath.map(printChildren, "children");
      cases.push(
        indent([hardline, join(hardline, childrenPrinted)]),
        isLast ? "" : hardline
      );
    }, "code");
  }, "cases");

  const afterCase = !!node.default ? "" : hardline;
  printed.push(indent([hardline, cases]), afterCase);

  if (node.default) {
    path.call((childPath) => {
      const childrenPrinted = childPath.map(printChildren, "children");

      printed.push(
        indent([
          hardline,
          "default:",
          indent([hardline, join(hardline, childrenPrinted)]),
        ]),
        hardline
      );
    }, "default");
  }

  printed.push("}");

  return printed;
};

export const printIf: PrintNodeFunction<IfNode, IfNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const printed: Doc = [];
  if (!node.body) throw Error("if expression body missing");

  const shouldBreak = path.getParentNode()?.type == "if";

  if (shouldBreak) printed.push(breakParent); // maybe?  for if's under for's and nested ifs?
  printed.push(node.body.trim()); // if, else, etc

  if (node.test) {
    if (node.test.type == "parenblock") {
      //handle paren blocks here
      path.call((testPath) => {
        const paren = testPath.getValue() as ParenBlockNode;
        if (paren.type != "parenblock") throw Error("expected parenblock node");

        const testPrinted = path.map(printChildren, "children");
        printed.push(
          " (",
          group([indent([softline, testPrinted]), softline]),
          ")"
        );
      }, "test");
    } else {
      printed.push(" ", path.call(printChildren, "test"));
    }
  }
  if (node.consequent) {
    const printedCons: Doc = path.call(printChildren, "consequent");
    if (node.consequent.type != "codeblock") {
      printed.push(fill([indent([ifBreak(line, " "), printedCons])]));
    } else {
      printed.push([" ", printedCons]);
    }
  }
  if (node.alternate) {
    const sep: Doc = node.consequent?.type == "codeblock" ? " " : hardline;
    printed.push(sep, path.call(printChildren, "alternate"), " ");
  }

  return group(printed);
};

export const printTernary: PrintNodeFunction<
  TernaryExpressionNode,
  TernaryExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  const test = [path.call(printChildren, "test"), " "];
  printed.push("? ");
  printed.push(path.call(printChildren, "consequent"));

  if (node.alternate) {
    printed.push(line, ": ");
    printed.push(path.call(printChildren, "alternate"));
  }

  return group([test, indent([softline, printed])]);
};
