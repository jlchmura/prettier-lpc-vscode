import { AstPath, Doc } from "prettier";
import { LPCOptions } from "..";
import { LPCNode } from "../../nodeTypes/lpcNode";

export type PrintChildrenFunction = (
  selector?: string | number | Array<string | number> | AstPath
) => Doc;
export type PrintNodeFunction<
  T extends LPCNode = LPCNode,
  A extends LPCNode = any
> = (
  node: T,
  path: AstPath<A>,
  options: LPCOptions,
  printChildren: PrintChildrenFunction
) => Doc;

export const needsSemi = (path: AstPath<LPCNode>) => {
  // if we're within certain nodes, we know for sure
  // a semi is not needed
  let n: LPCNode | null;
  let i = 0;
  while (!!(n = path.getParentNode(i++))) {
    if (path.getName() == "codeblock" || path.getName() == "consequent") break;
    if (n.type == "ternary") return false;
    if (n.type == "parenblock") return false;
    if (n.type == "for") return false;
    if (n.type == "call-exp") return false;
    if (n.type == "mapping-pair") return false;
    if (n.type == "indexor-exp") return false;
    if (n.type == "assignment-exp") return false;
    if (n.type == "array") return false;
    if (n.type == "codeblock") break;
  }

  return (
    // print semis for declarations at the root level
    path.match(
      (n) => n.type === "var-decl",
      (n) => n.type == "root"
    ) ||
    // all other scenarios
    path.match(
      (n) =>
        n.type == "lambda" ||
        n.type == "var-decl" ||
        n.type == "call-exp" ||
        n.type == "assignment-exp" ||
        n.type == "member-exp",
      (n, nm, idx) =>
        n.type !== "ternary" &&
        n.type !== "function" &&
        n.type !== "call-exp" &&
        n.type !== "parenblock" &&
        n.type !== "member-exp" &&
        n.type !== "var" &&
        n.type !== "return" &&
        n.type !== "type-cast" &&
        n.type !== "assignment-exp" &&
        (n.type !== "binary-exp" || nm != "left") &&
        (n.type !== "for" || nm == "codeblock"), // for will print its own semis, but the for's codeblock is ok to have semi
      (n) =>
        n.type !== "parenblock" &&
        n.type !== "var" &&
        n.type !== "assignment-exp"
    )
  );
};

export const getNodeText = (text: string, node: LPCNode) => {
  return text.substring(node.start, node.end).trim();
};
