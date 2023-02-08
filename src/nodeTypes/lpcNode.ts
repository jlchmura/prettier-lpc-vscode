import { findFirst } from "../utils/arrays";
import { InlineCommentNode } from "./comment";

export class LPCNode {
  public type: string | undefined;
  public closeAtSemi: boolean = false;
  public body: string | undefined;
  public closed: boolean = false;
  public endsLine: boolean = false;  

  public suffixComments: InlineCommentNode|undefined;


  // public startTagEnd: number | undefined;
  // public endTagStart: number | undefined;
  public attributes: { [name: string]: string | null } | undefined;
  public get attributeNames(): string[] {
    return this.attributes ? Object.keys(this.attributes) : [];
  }

  public setAttribute(name: string, value: string) {
    this.attributes = this.attributes ?? {};
    this.attributes[name] = value;
  }

  constructor(
    public start: number,
    public end: number,
    public children: LPCNode[],
    public parent?: LPCNode
  ) {}
  public isSameTag(tagInLowerCase: string | undefined) {
    if (this.type === undefined) {
      return tagInLowerCase === undefined;
    } else {
      return (
        tagInLowerCase !== undefined &&
        this.type.length === tagInLowerCase.length &&
        this.type.toLowerCase() === tagInLowerCase
      );
    }
  }
  public get firstChild(): LPCNode | undefined {
    return this.children[0];
  }
  public get lastChild(): LPCNode | undefined {
    return this.children.length
      ? this.children[this.children.length - 1]
      : void 0;
  }

  public findNodeBefore(offset: number): LPCNode {
    const idx = findFirst(this.children, (c) => !!c && offset <= c.start) - 1;
    if (idx >= 0) {
      const child = this.children[idx];
      if (offset > child.start) {
        if (offset < child.end) {
          return child.findNodeBefore(offset);
        }
        const lastChild = child.lastChild;
        if (lastChild && lastChild.end === child.end) {
          return child.findNodeBefore(offset);
        }
        return child;
      }
    }
    return this;
  }

  public findNodeAt(offset: number): LPCNode {
    const idx = findFirst(this.children, (c) => !!c && offset <= c.start) - 1;
    if (idx >= 0) {
      const child = this.children[idx];
      if (offset > child.start && offset <= child.end) {
        return child.findNodeAt(offset);
      }
    }
    return this;
  }
}
