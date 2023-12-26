import { Doc, util } from "prettier";
import { builders } from "prettier/doc";
import {
  ArrayExpressionNode,
  IndexorExpressionNode,
} from "../../nodeTypes/arrayExpression";
import { LPCNode } from "../../nodeTypes/lpcNode";
import {
  MappingExpressionNode,
  MappingPair,
} from "../../nodeTypes/mappingExpression";
import { findFirst, last } from "../../utils/arrays";
import { getPreviousComment, printSuffixComments } from "./comment";
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

  const printPairs = node.printAsPairs && node.elements.length % 2 == 0;
  const prefixComment = getPreviousComment(path);

  if (node.elements.length > 0) {
    const elsPrinted: Doc = [];
    let sepParts: Doc = [];

    // see: https://prettier.io/docs/en/rationale.html#multi-line-objects
    const bracketPos = node.start + 2;
    const firstElPos = node.elements[0].start;
    if (util.hasNewlineInRange(options.originalText, bracketPos, firstElPos)) {
      elsPrinted.push(breakParent);
    }

    let pair: Doc[] = [];
    let idx=0;
    let groupId=Symbol("array pair");
    path.each((childPath) => {
      const nd = childPath.getValue();

      if (printPairs) {
        let child = childPath.call(printChildren);
        if (pair.length==1) child = indentIfBreak([softline,child],{groupId: groupId});
        pair.push([sepParts,child]);

        if (pair.length==2) {
          const terminal = idx < node.elements.length-2 ? hardline : "";
          elsPrinted.push(group([fill([(pair), ",",terminal])],{id: groupId}));
          
          pair=[];
          sepParts=[];
          groupId = Symbol("array pair" + idx.toString());
        } else {
          sepParts = [", "];
        } 

        //pair.push([sepParts,childPath.call(printChildren)]);
        //sepParts = [",", line];
      } else {
        elsPrinted.push(sepParts, fill([printChildren()]));

        sepParts = [",", line];
      }
      if (nd.type == "blankline" || nd.type == "directive") sepParts = softline;
      if (nd.type?.startsWith("comment")) sepParts = softline;
      idx++;
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
          options.trailingComma && !printPairs ? ifBreak(sepParts) : "",
        ]),
        softline,
      ])
    );
  }

  printed.push(dedent("})"));

  // fill will cause nested arrays to inline if possible
  //return fill(printed);
  return printed;
};

export const printMappingPair: PrintNodeFunction<MappingPair, MappingPair> = (
  node,
  path,
  options,
  printChildren
) => {
  const pair = node;
  // always print a mapping key
  const pairPrinted: Doc = [path.call(printChildren, "key")];

  // if there are values, print those
  if (pair.value && pair.value.length > 0) {
    pairPrinted.push(":");
    // there may be multiple values, which are joined by a semi
    const valuesPrinted = path.map(printChildren, "value");
    pairPrinted.push(group([indent([line, join([";", line], valuesPrinted)])]));
  }
  return group(pairPrinted);
};

export const printMapping: PrintNodeFunction<
  MappingExpressionNode,
  MappingExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];
  printed.push("([");

  if (node.elements.length > 0) {
    const elsPrinted = path.map(printChildren, "elements");

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
