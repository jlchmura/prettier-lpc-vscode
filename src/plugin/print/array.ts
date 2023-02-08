import { Doc } from "prettier";
import { builders } from "prettier/doc";
import {
  ArrayExpressionNode,
  IndexorExpressionNode,
} from "../../nodeTypes/arrayExpression";
import { MappingExpressionNode } from "../../nodeTypes/mappingExpression";
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

export const printArray: PrintNodeFunction<
  ArrayExpressionNode,
  ArrayExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  const groupId = Symbol("array");

  printed.push("({");

  if (node.elements.length > 0) {
    const elsPrinted: Doc = [];
    let sepParts: Doc = [];

    path.each((childPath) => {
      const nd = childPath.getValue();

      elsPrinted.push(sepParts, fill([printChildren()]));

      sepParts = [",", line];
      if (nd.type == "blankline") sepParts = softline;
      if (nd.type?.startsWith("comment")) sepParts = softline;
    }, "elements");

    // massage the final sep.  If we ended w/ a softline, set that to empty
    // if we ended with ,line set that to just comma
    if (sepParts.length != 2) sepParts = [];
    else sepParts = ",";

    printed.push(
      fill([
        indent([
          softline,
          // elements are joined by a comma
          group(elsPrinted, { id: groupId }),
          options.trailingComma ? ifBreak(sepParts) : "",
        ]),
        softline,
      ])
    );
  }
  //printed.push(ifBreak(hardline, "", { groupId: groupId }), dedent("})"));
  printed.push(ifBreak("", ""), dedent("})"));

  // fill will cause nested arrays to inline if possible
  //return fill(printed);
  return printed;
};

export const printMapping: PrintNodeFunction<
  MappingExpressionNode,
  MappingExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  printed.push("([");

  if (node.elements.length > 0) {
    const elsPrinted = path.map((e) => {
      const pair = e.getValue();
      // always print a mapping key
      const pairPrinted: Doc = [e.call(printChildren, "key")];

      // if there are values, print those
      if (pair.value && pair.value.length > 0) {
        pairPrinted.push(":", line);
        // there may be multiple values, which are joined by a semi
        pairPrinted.push(join([";", line], e.map(printChildren, "value")));
      }
      return group(pairPrinted);
    }, "elements");

    printed.push(
      indent([
        softline,
        // mapping entires are joined by a comma
        group(join([",", line], elsPrinted)),
        options.trailingComma ? ifBreak(",") : "",
      ]),
      softline
    );
  }

  printed.push("])");
  return printed;
};

export const printIndexorExpression: PrintNodeFunction<
  IndexorExpressionNode,
  IndexorExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  printed.push(...path.map(printChildren, "children"));

  return printed;
};
