import { ScannerState, TextDocument, TokenType } from "../lpcLanguageTypes";
import { findFirst, last, pushIfVal } from "../utils/arrays";
import { LPCNode } from "../nodeTypes/lpcNode";
import { IfNode } from "../nodeTypes/if";

import { ParenBlockNode } from "../nodeTypes/parenBlock";
import { LiteralNode } from "../nodeTypes/literal";
import { CodeBlockNode } from "../nodeTypes/codeBlock";
import { DirectiveNode } from "../nodeTypes/directive";
import { InheritNode } from "../nodeTypes/inherit";
import { BlankLinkNode } from "../nodeTypes/blankLine";
import { CallExpressionNode } from "../nodeTypes/callExpression";
import {
  ArrayExpressionNode,
  IndexorExpressionNode,
} from "../nodeTypes/arrayExpression";
import {
  MemberExpressionNode,
  ParentExpressionNode,
} from "../nodeTypes/memberExpression";
import { IdentifierNode } from "../nodeTypes/identifier";
import { BinaryExpressionNode } from "../nodeTypes/binaryExpression";
import { AssignmentExpressionNode } from "../nodeTypes/assignmentExpression";
import {
  VariableDeclarationNode,
  VariableDeclaratorNode,
} from "../nodeTypes/variableDeclaration";
import { CommentBlockNode, InlineCommentNode } from "../nodeTypes/comment";
import { FunctionDeclarationNode } from "../nodeTypes/functionDeclaration";
import {
  MappingExpressionNode,
  MappingPair,
} from "../nodeTypes/mappingExpression";
import { modifiers, unary_ops_set } from "./defs";
import { UnaryPrefixExpressionNode } from "../nodeTypes/unaryPrefixExpression";
import { ForStatementNode } from "../nodeTypes/forStatement";
import { ControlFlowStatementNode } from "../nodeTypes/controlFlowStatement";
import { Scanner } from "./lpcScanner";
import { debug } from "console";
import { ReturnNode } from "../nodeTypes/returnNode";
import { TypeCastExpressionNode } from "../nodeTypes/typeCast";
import { SwitchCaseNode, SwitchNode } from "../nodeTypes/switch";
import { WhileStatementNode } from "../nodeTypes/whileStatement";
import { LogicalExpressionNode } from "../nodeTypes/logicalExpression";
import { TernaryExpressionNode } from "../nodeTypes/ternaryExpression";

export interface LPCDocument {
  roots: LPCNode[];
  findNodeBefore(offset: number): LPCNode;
  findNodeAt(offset: number): LPCNode;
}

export const enum ParseExpressionFlag {
  StatementOnly = 0b0000,
  AllowDeclaration = 0b0001,
  AllowFunction = 0b0010,
}

export class LPCParser {
  private scanner!: Scanner;
  private text!: string;

  constructor() {} //private dataManager: HTMLDataManager

  public parseDocument(document: TextDocument): LPCDocument {
    return this.parse(document.getText()); //this.dataManager.getVoidElements(document.languageId));
  }

  public parse(text: string): LPCDocument {
    this.scanner = new Scanner(text, undefined, undefined);
    this.text = text;

    const lpcDoc = new LPCNode(0, text.length, [], void 0);
    lpcDoc.type = "codeblock";
    let curr = lpcDoc;
    let token = this.scanner.scan();

    while (token !== TokenType.EOS) {
      this.parseToken(token, curr);

      token = this.scanner.scan();
    }
    while (curr?.parent) {
      curr.end = text.length;
      curr.closed = false;
      curr = curr.parent;
    }
    return {
      roots: lpcDoc.children,
      findNodeBefore: lpcDoc.findNodeBefore.bind(lpcDoc),
      findNodeAt: lpcDoc.findNodeAt.bind(lpcDoc),
    };
  }

  private eatWhitespace() {
    while (this.scanner.peek() == TokenType.Whitespace) {
      this.scanner.scan();
    }
  }

  private eatWhitespaceToEOL() {
    while (this.scanner.peek() == TokenType.Whitespace) {
      this.scanner.scan();
    }
    this.scanner.eat(TokenType.BlankLines);
  }

  private eatWhitespaceAndNewlines() {
    while (
      this.scanner.peek() == TokenType.Whitespace ||
      this.scanner.peek() == TokenType.BlankLines
    ) {
      this.scanner.scan();
    }
  }

  private parseToken(
    token: TokenType,
    curr: LPCNode,
    flags: ParseExpressionFlag = ParseExpressionFlag.AllowDeclaration |
      ParseExpressionFlag.AllowFunction
  ): LPCNode | undefined {
    let nd: LPCNode;

    switch (token) {
      case TokenType.EOS:
        return undefined;
      case TokenType.Semicolon:
        return undefined;
      case TokenType.BlankLines:
        return this.parseBlankLink(curr);
      case TokenType.Whitespace:
        return undefined;
      case TokenType.ParenBlock:
        return this.parseMaybeExpression(token, curr, ParseExpressionFlag.StatementOnly);
        //return this.parseParenBlock(curr, flags);
      case TokenType.Inherit:
        return this.parseInherit(curr);
      case TokenType.InheritanceAccessor:
        return this.parseInheritanceAccessor(curr);
      case TokenType.Directive:
        return this.parseDirective(curr);
      case TokenType.DirectiveArgument:
        throw `unexpected directive argument at ${this.scanner.getTokenOffset()}`;
      case TokenType.Literal:
      case TokenType.LiteralNumber:
      case TokenType.LiteralChar:
        return this.parseLiteral(token, curr);
      case TokenType.StartCommentBlock:
        return this.parseCommentBlock(curr);
      case TokenType.EndCommentBlock:
        throw "got end comment block without start";
      case TokenType.Comment:
        // if comment did not start on its own line, and there was a child, attach to that as a suffix comment
        const lastChild =
          curr.children.length > 0
            ? curr.children[curr.children.length - 1]
            : undefined;
        if (!this.scanner.didTokenStartOnOwnLine() && lastChild) {
          return this.parseComment(
            curr.children[curr.children.length - 1],
            true
          );
        } else {
          return this.parseComment(curr);
        }
      case TokenType.Modifier:
      case TokenType.Type:
      case TokenType.DeclarationName:
      case TokenType.Variable:
        return this.parseMaybeExpression(token, curr, flags);
      case TokenType.TypeCast:
        return this.parseTypeCast(curr);
      case TokenType.ArrayStart:
        return this.parseMaybeExpression(token, curr, flags);
      case TokenType.MappingStart:
        return this.parseMaybeExpression(token, curr, flags);
      case TokenType.FunctionArgumentType:
        throw Error("not handled");  // todo: remove this
      case TokenType.FunctionArgument:
        throw Error("not handled");  // todo: remove this
      case TokenType.CodeBlockStart:
        return this.parseCodeBlock(curr);
      case TokenType.CodeBlockEnd:
        throw Error(
          `unexpected codeblock end at [${this.scanner.getTokenOffset()}]: ${this.scanner.getTokenText()}`
        );
      case TokenType.If:
      case TokenType.ElseIf:
      case TokenType.Else:
        return this.parseIf(token, curr);
      case TokenType.Ternary:
        throw Error(
          `Unexpected ternary expression at ${this.scanner.getTokenOffset()}`
        );
      case TokenType.For:
        return this.parseFor(curr);
      case TokenType.While:
        return this.parseWhile(curr);
      case TokenType.ControlFlow:
        return this.parseControlFlow(curr);
      case TokenType.Expression:
        const expNd = new LPCNode(
          this.scanner.getTokenOffset(),
          this.scanner.getTokenEnd(),
          [],
          curr
        );
        expNd.type = "exp";
        curr.children.push(expNd);
        return expNd;
      case TokenType.Operator:
        return this.parseOperator(token, curr);
      case TokenType.LogicalOperator:
        return this.parseLogicalExpression(
          curr,
          ParseExpressionFlag.StatementOnly
        );
      case TokenType.Return:
        return this.parseReturn(curr);
      case TokenType.AssignmentOperator:
        return this.parseMaybeUnaryPrefixOperator(token, curr);
      case TokenType.Switch:
        return this.parseSwitch(curr);
    }

    throw Error(
      `unhandled token type ${token} @ ${this.scanner.getTokenOffset()} [${this.scanner.getTokenText()}]:\nErr: ${this.scanner.getTokenError()}`
    );
  }

  private parseMaybeUnaryPrefixOperator(token: TokenType, parent: LPCNode) {
    const op = this.scanner.getTokenText().trim();
    if (unary_ops_set.has(op)) {
      const upfx = new UnaryPrefixExpressionNode(
        this.scanner.getTokenOffset(),
        this.scanner.getTokenEnd(),
        [],
        parent
      );
      parent.children.push(upfx);
      upfx.operator = op;

      this.eatWhitespace();
      upfx.operand = this.parseToken(
        this.scanner.scan(),
        upfx,
        ParseExpressionFlag.StatementOnly
      );
      this.eatWhitespaceAndNewlines();

      // check if this is a ternary exp
      this.scanner.peek();
      const txt = this.scanner.getTokenText();
      if (this.scanner.peek() == TokenType.Ternary) {
        this.scanner.scan();
        const tern = this.parseTernary(upfx);
        parent.children.push(tern);
        return tern;
      }

      return upfx;
    } else {
      return this.parseAssignmentOperator(token, parent);
    }
  }

  private tryParseComment(parent: LPCNode) {
    if (this.scanner.peek() == TokenType.Comment) {
      this.scanner.scan();
      return this.parseComment(parent, true);
    }
    if (this.scanner.peek() == TokenType.StartCommentBlock) {
      const cb = new CommentBlockNode(
        this.scanner.getTokenOffset(),
        this.scanner.getTokenEnd(),
        [],
        void 0
      );
      while (this.scanner.scan() != TokenType.EndCommentBlock) {}

      cb.end = this.scanner.getTokenEnd();
      cb.body = this.text.substring(cb.start, cb.end).trim();

      parent.suffixComments = cb;
      return cb;
    }
  }

  private parseComment(parent: LPCNode, isSuffix = false) {
    const com = new InlineCommentNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    com.body = this.scanner.getTokenText().replace("//", "").trim();
    com.type = "comment-singleline";
    com.endsLine = true;
    if (com.body == "comment after test_m()") debugger;

    // some comments go in children, some are a suffixComment
    if (parent.type == "codeblock" || !isSuffix) {
      parent.children.push(com);
    } else {
      parent.suffixComments = com;
    }

    return com;
  }

  private parseCommentBlock(parent: LPCNode) {
    const comBlk = new CommentBlockNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(comBlk);

    const t = this.scanner.scan();
    if (t != TokenType.EndCommentBlock) throw "expected end of comment block";

    comBlk.end = this.scanner.getTokenEnd();
    comBlk.body = this.text.substring(comBlk.start, comBlk.end);
    comBlk.endsLine = true;
    return comBlk;
  }

  private parseParenBlock(parent: LPCNode, flags: ParseExpressionFlag) {
    const nd = new ParenBlockNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    const tt = this.scanner.getTokenText().trim();

    const children: LPCNode[] = [];

    let t: TokenType;
    // scan until we get a paren block end
    let tempParent: LPCNode = nd;
    while (
      (t = this.scanner.scan()) &&
      t != TokenType.ParenBlockEnd &&
      t != TokenType.EOS
    ) {
      const tempText = this.scanner.getTokenText().trim();

      if (
        t == TokenType.Comma ||
        t == TokenType.BlankLines ||
        t == TokenType.Whitespace
      ) {
        // a comma in this position is a separator
        // also skip blanklines
        continue;
      }

      let newNode: LPCNode;
      if (t == TokenType.LogicalOperator) {
        newNode = this.parseLogicalExpression(last(children)!, flags);
        children.pop();
        children.push(newNode);
      } else {
        newNode = this.parseToken(t, tempParent, flags)!;
        if (!newNode) throw Error(`Unexpected token @ ${this.scanner.getTokenOffset()}`);
        children.push(newNode);
      }
    }

    if (t != TokenType.ParenBlockEnd) throw "expected parenblock end";

    nd.closed = true;

    // check if this implies something about the parent node
    if (parent.type == "decl") {
      debugger;
      // probably not used anymore?

      // this makes the decl a call expression
      parent.type = "call-exp";
    }

    nd.children = [...children];

    this.eatWhitespace();
    this.tryParseComment(nd);

    // before finishing up, check for an arrow.. this paren block may actsually be a member-exp
    if (this.scanner.peek() == TokenType.Arrow && parent?.type == "codeblock") {
      this.scanner.scan(); // consume the arrow
      return this.parseArrow(parent, nd);
    }

    parent.children.push(nd);
    return nd;
  }

  private parseLiteral(token: TokenType, parent: LPCNode) {
    let lh :LPCNode = this.parseLiteralInternal(token, parent);

    this.eatWhitespace();
    let tt = this.scanner.peek();
    
    if (tt == TokenType.Operator || tt == TokenType.Star) {
      //binary expr
      this.scanner.scan();
      lh = this.parseBinaryExpression(lh, parent);
      this.eatWhitespaceAndNewlines();
      tt = this.scanner.peek();
    } else if (tt == TokenType.LogicalOperator) {
      this.scanner.scan();
      const leNode = this.parseLogicalExpression(lh, ParseExpressionFlag.StatementOnly);      
      return leNode;
    } else if (tt == TokenType.Arrow) {
      // an arrow can come after a string literal
      // the string is interpreted as an object
      this.scanner.scan();      
      const ln = lh as LiteralNode;
      if (ln.dataType != "string")
        throw Error(`Expected string before arrow but got ${ln.dataType}`);
      return this.parseArrow(parent, ln);
    } else if (tt == TokenType.Literal) {
      // consequetive literals can be treated like a binary expression
      this.scanner.scan();
      const be = new BinaryExpressionNode(
        this.scanner.getTokenOffset(),
        this.scanner.getTokenEnd(),
        [],
        parent
      );

      const rh = this.parseLiteralInternal(tt, be);

      be.left = lh;
      be.right = rh;
      be.operator = "+";
      return be;
    }

    return lh;
  }

  private parseLiteralInternal(token: TokenType, parent: LPCNode) {
    const nd = new LiteralNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );

    switch (token) {
      case TokenType.Literal:
        nd.dataType = "string";
        break;
      case TokenType.LiteralChar:
        nd.dataType = "char";
        break;
      case TokenType.LiteralNumber:
        nd.dataType = "number";
        break;
    }

    nd.body = this.scanner.getTokenText().trim();

    parent.children.push(nd);

    this.eatWhitespace();
    this.tryParseComment(nd);

    return nd;
  }

  private parseBinaryExpression(left: LPCNode, parent: LPCNode) {
    const nd = new BinaryExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    nd.operator = this.scanner.getTokenText().trim();
    
    nd.left = left;

    const nextToken = this.scanner.scan();
    nd.right = this.parseToken(
      nextToken,
      nd,
      ParseExpressionFlag.StatementOnly
    );

    // check if this is a ternary exp
    this.eatWhitespace();
    if (this.scanner.peek() == TokenType.Ternary) {
      this.scanner.scan();
      const tern = this.parseTernary(nd);
      parent.children.push(tern);
      return tern;
    }

    this.eatWhitespace();
    this.tryParseComment(nd);

    return nd;
  }

  private parseCodeBlock(parent: LPCNode) {
    const cb = new CodeBlockNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    cb.type = "codeblock";
    parent.children.push(cb);

    const children: LPCNode[] = [];

    this.eatWhitespace();
    this.tryParseComment(cb);
    this.eatWhitespaceAndNewlines();

    let t: TokenType;
    // scan until we get a paren block end
    while ((t = this.scanner.scan()) && t != TokenType.CodeBlockEnd) {
      const tempTxt = this.scanner.getTokenText();
      if (t == TokenType.EOS) {
        throw Error(`unexpected eos in codeblock starting at [${cb.start}]`);
      }
      if (t == TokenType.Semicolon) {
        // leftover semi, consume it
        this.scanner.eat(TokenType.BlankLines);
        continue;
      }

      const child = this.parseToken(
        t,
        cb,
        ParseExpressionFlag.AllowDeclaration
      );
      if (child) children.push(child);
    }

    if (t != TokenType.CodeBlockEnd) throw "Expected codeblock end";

    cb.end = this.scanner.getTokenEnd();
    cb.children = [...children];
    cb.closed = true;

    return cb;
  }

  private parseControlFlow(parent: LPCNode) {
    const nd = new ControlFlowStatementNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    nd.controlStatement = this.scanner.getTokenText().trim();

    parent.children.push(nd);

    return nd;
  }

  private parseIf(token: TokenType, parent: LPCNode) {
    const nd = new IfNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );

    parent.children.push(nd);

    nd.body = this.text.substring(nd.start, nd.end);

    let t: TokenType;
    while (!nd.closed && (t = this.scanner.scan())) {
      if (t == TokenType.EOS) throw "could not find consequent";
      const tempText = this.scanner.getTokenText();
      switch (t) {
        case TokenType.BlankLines:
        case TokenType.Whitespace:
          break;
        case TokenType.CodeBlockStart:
          nd.consequent = this.parseCodeBlock(nd);
          this.scanner.eat(TokenType.BlankLines);
          nd.consequent.closed = true;
          nd.closed = true;
          break;
        case TokenType.Semicolon:
          if (!nd.consequent) throw "got semi without consequent";
          // semi is part of consequent stmt so parse and add it there.
          this.parseToken(t, nd.consequent);
          nd.closed = true;
          break;
        case TokenType.ParenBlock:
          // if we don't have a conseuqent then parens are part of test
          // otherwise let it fall through so parens will get parsed into
          // current consequent
          if (!nd.consequent) {
            nd.test = this.parseParenBlock(
              nd,
              ParseExpressionFlag.StatementOnly
            );
            this.eatWhitespaceAndNewlines();
            break;
          }
        default:
          if (!nd.consequent) {
            nd.consequent = this.parseToken(t, nd, ParseExpressionFlag.StatementOnly);
          }
          nd.closed = true;
      }
    }

    // see if there is another if
    this.eatWhitespace();
    if (
      this.scanner.peek() == TokenType.Else ||
      this.scanner.peek() == TokenType.ElseIf
    ) {
      nd.alternate = this.parseIf(this.scanner.scan(), nd);
    }

    return nd;
  }

  private parseTernary(test: LPCNode) {
    const nd = new TernaryExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      test.parent
    );

    this.eatWhitespaceAndNewlines();

    nd.test = test;
    nd.consequent = this.parseToken(
      this.scanner.scan(),
      nd,
      ParseExpressionFlag.StatementOnly
    );

    this.eatWhitespaceAndNewlines();
    if (this.scanner.peek() == TokenType.Colon) {
      this.scanner.scan();
      nd.alternate = this.parseToken(
        this.scanner.scan(),
        nd,
        ParseExpressionFlag.StatementOnly
      );
    }

    this.eatWhitespaceAndNewlines();
    if (this.scanner.peek() == TokenType.Semicolon) {
      this.scanner.scan();
    }

    this.eatWhitespace();
    this.tryParseComment(nd);

    return nd;
  }

  private parseOperator(token: TokenType, parent: LPCNode) {
    const nd = this.parseMaybeUnaryPrefixOperator(token, parent);
    if (!nd)
      throw Error(
        `Could not parse operator @ [${this.scanner.getTokenOffset()}]`
      );
    return nd;
  }

  private parseLogicalExpression(left: LPCNode, flags: ParseExpressionFlag) {
    if (!left)
      throw Error(
        `logical exp missing left token @ ${this.scanner.getTokenOffset()}`
      );

    const nd = new LogicalExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      left.parent // use left's parent as the parent
    );
    nd.operator = this.scanner.getTokenText().trim();
    nd.left = left;

    const nextToken = this.scanner.scan();
    nd.right = this.parseToken(
      nextToken,
      nd,
      ParseExpressionFlag.StatementOnly
    );

    this.eatWhitespace();
    this.tryParseComment(nd);

    return nd;
  }

  private parseReturn(parent: LPCNode) {
    const nd = new ReturnNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(nd);

    this.eatWhitespaceAndNewlines();

    const t = this.scanner.scan();
    if (t != TokenType.Semicolon) {
      nd.argument = this.parseToken(t, nd, ParseExpressionFlag.StatementOnly);
      this.eatWhitespace();

      if (this.scanner.peek() == TokenType.Semicolon) {
        // eat the semicolon if one was left over
        this.scanner.scan();
      }
    }

    this.tryParseComment(nd);

    this.eatWhitespaceToEOL();

    return nd;
  }

  private parseDirective(parent: LPCNode) {
    const nd = new DirectiveNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(nd);

    nd.directiveType = new IdentifierNode(nd.start, nd.end, [], parent);
    nd.directiveType.name = this.scanner.getTokenText().trim();

    this.eatWhitespace();
    let t: TokenType,
      lastToken: TokenType = 0;
    while ((t = this.scanner.scan()) && t != TokenType.DirectiveEnd) {
      if (t != TokenType.DirectiveLineBreak) {
        const arg = new LiteralNode(
          this.scanner.getTokenOffset(),
          this.scanner.getTokenEnd(),
          [],
          nd
        );
        arg.body = this.scanner.getTokenText();

        // the first literal is a key
        // after that they are additional arg lines
        if (nd.key) {
          nd.arguments.push(arg);
        } else {
          nd.key = arg;
        }
      }

      lastToken = t;
    }

    return nd;
  }

  private parseInherit(parent: LPCNode) {
    const inh = new InheritNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    inh.body = this.scanner.getTokenText();

    this.eatWhitespace();

    inh.argument = this.parseToken(
      this.scanner.scan(),
      inh,
      ParseExpressionFlag.StatementOnly
    );

    switch (inh.argument?.type) {
      case "var-decl":
      case "binary-exp":
      case "literal":
      case "parenblock":
        // ok
        break;
      default:
        throw Error(
          `Invalid expression type (${
            inh.argument?.type
          }) after inherit @ ${this.scanner.getTokenOffset()}`
        );
    }

    // there should be a semicolon left
    if (this.scanner.scan() != TokenType.Semicolon)
      throw Error(`Expected semicolon at ${this.scanner.getTokenOffset()}`);

    this.eatWhitespace();
    this.tryParseComment(inh);

    this.scanner.eat(TokenType.BlankLines);

    parent.children.push(inh);
    return inh;
  }

  private parseBlankLink(parent: LPCNode) {
    const nd = new BlankLinkNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(nd);

    // collapse multiple blank lines into 1
    this.eatWhitespaceAndNewlines();
    
    this.tryParseComment(nd);

    return nd;
  }

  private parseCallExpression(
    parent: LPCNode,
    callee: LPCNode,
    parenBlock?: ParenBlockNode
  ) {
    let nd = new CallExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );

    nd.arguments = [];
    nd.callee = callee;

    this.eatWhitespace();

    if (!parenBlock) {
      if (this.scanner.peek() != TokenType.ParenBlock)
        throw "expected paren block after callee";
      this.scanner.scan(); // eat the opening paren

      parenBlock = this.parseParenBlock(
        nd,
        ParseExpressionFlag.StatementOnly
      ) as ParenBlockNode;
    }
    nd.arguments = [...parenBlock.children];

    this.eatWhitespace();

    const peekToken = this.scanner.peek();
    if (peekToken == TokenType.Semicolon && nd.parent?.type == "codeblock") {
      this.scanner.scan();
      this.scanner.eat(TokenType.BlankLines);
    } else if (peekToken == TokenType.Arrow) {
      this.scanner.scan();
      const arrow = this.parseArrow(parent, nd);
      return arrow;
    }

    nd.closed = true;
    this.tryParseComment(nd);

    parent.children.push(nd);

    return nd;
  }

  private parseInheritanceAccessor(parent: LPCNode, id?: IdentifierNode) {
    const nd = new ParentExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    nd.object = id;

    const t = this.scanner.scan();
    if (t != TokenType.DeclarationName) throw "unexpected token after ::";
    const idNd = new IdentifierNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      nd
    );
    idNd.name = this.scanner.getTokenText();
    nd.property = idNd;

    this.eatWhitespace();
    if (this.scanner.peek() != TokenType.ParenBlock)
      throw "unexpected token after :: property";

    // arguments (paren block) get parsed by call expression
    return this.parseCallExpression(parent, nd);
  }

  private parseArrow(
    parent: LPCNode,
    id: IdentifierNode | LiteralNode | CallExpressionNode | ParenBlockNode
  ): CallExpressionNode {
    // an arrow is a member expression inside a call expression
    let tempText = this.scanner.getTokenText();
    const nd = new MemberExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    //parent.children.push(nd);

    nd.object = id;

    const t = this.scanner.scan();
    tempText = this.scanner.getTokenText();
    if (t != TokenType.DeclarationName)
      throw Error(
        `unexpected token after arrow @ ${this.scanner.getTokenOffset()}`
      );
    const idNd = new IdentifierNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      nd
    );
    idNd.name = this.scanner.getTokenText();
    nd.property = idNd;

    this.eatWhitespace();
    if (this.scanner.peek() != TokenType.ParenBlock)
      throw Error(
        `unexpected token after arrow property @ ${this.scanner.getTokenOffset()}`
      );

    // arguments (paren block) get parsed by call expression
    return this.parseCallExpression(parent, nd);
  }

  private parseAssignmentOperator(token: TokenType, parent: LPCNode) {
    const nd = new LPCNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    nd.type = "assignment";
    nd.body = this.scanner.getTokenText().trim();
    nd.setAttribute("operator", this.scanner.getTokenText().trim());

    parent.children.push(nd);

    return nd;
  }

  private parseVariableDeclaration(
    decl: VariableDeclarationNode,
    parent: LPCNode,
    id?: IdentifierNode,
    init?: LPCNode
  ) {
    this.eatWhitespace();

    // if we were passed an id/init node, then set that up as an initial declarator
    if (id) {
      const d = new VariableDeclaratorNode(id?.start, id?.end, [], decl);
      d.id = id;
      d.init = init;
      decl.declarations.push(d);
    }

    while (this.scanner.peek() != TokenType.Semicolon) {
      const tempText = this.scanner.getTokenText();
      switch (this.scanner.peek()) {
        case TokenType.Comma:
        case TokenType.Whitespace:
        case TokenType.BlankLines:
          this.scanner.scan();
          continue;     
        case TokenType.Comment:   
        case TokenType.StartCommentBlock:
          this.tryParseComment(last(decl.declarations)!);
          continue;
        case TokenType.Star:
        case TokenType.DeclarationName:
          this.scanner.scan();
          this.parseVariableDeclarator(decl);
          break;
        default:
          return decl;
      }
    }

    if (this.scanner.scan() != TokenType.Semicolon) {
      throw "Expected semicolon after declaration";
    }

    this.tryParseComment(decl);

    this.scanner.eat(TokenType.BlankLines);

    return decl;
  }

  private parseVariableDeclarator(parent: VariableDeclarationNode) {
    const d = new VariableDeclaratorNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );

    let hasStar =false;
    if (this.scanner.getTokenType() == TokenType.Star) {
      this.scanner.scan();
      hasStar=true;
    }
    
    const i = this.parseIdentifier(hasStar);
    
    d.id = i;

    this.eatWhitespace();

    // see if there is an initializer
    if (this.scanner.peek() == TokenType.AssignmentOperator) {
      const t = this.scanner.scan();
      d.init = this.parseToken(t, d);
    }

    d.children = []; // not needed, blank this out
    parent.declarations.push(d);
    return d;
  }

  private parseAssignmentExpression(
    exp: AssignmentExpressionNode,
    parent: LPCNode
  ) {
    // these two operators do not have a right side
    if (exp.operator == "++" || exp.operator == "--") return exp;
    if (exp.left?.name == "averagedam") debugger;
    this.eatWhitespace();
    exp.right = this.parseToken(
      this.scanner.scan(),
      exp,
      ParseExpressionFlag.StatementOnly
    );

    return exp;
  }

  private parseModifiers() {
    const mods: IdentifierNode[] = [];
    while (this.scanner.getTokenType() == TokenType.Modifier) {
      const nd = new IdentifierNode(
        this.scanner.tokenOffset,
        this.scanner.getTokenEnd(),
        [],
        void 0
      );
      nd.name = this.scanner.getTokenText().trim();
      mods.push(nd);

      this.eatWhitespace();
      this.scanner.scan();
    }
    return mods;
  }

  private parseType() {
    if (this.scanner.getTokenType() == TokenType.Type) {
      const nd = new IdentifierNode(
        this.scanner.tokenOffset,
        this.scanner.getTokenEnd(),
        [],
        void 0
      );
      nd.name = this.scanner.getTokenText().trim();

      this.eatWhitespace();
      this.scanner.scan();

      return nd;
    }
  }

  private parseStar() {
    if (this.scanner.getTokenType() == TokenType.Star) {      
     this.scanner.scan(); 
     return true;
    } else {
      return false;
    }
  }

  private parseTypeCast(parent: LPCNode) {
    const nd = new TypeCastExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );

    let typeName = this.scanner.getTokenText();
    typeName = typeName.substring(1, typeName.length - 1);

    nd.dataType = new IdentifierNode(nd.start + 1, nd.end - 1, [], nd);
    nd.dataType.name = typeName;

    // get the next token and parse it as the type cast's expression
    this.eatWhitespace();
    nd.exp = this.parseToken(this.scanner.scan(), nd);

    parent.children.push(nd);

    return nd;
  }

  private parseIdentifier(hasStar=false) {
    if (this.scanner.getTokenType() == TokenType.DeclarationName) {
      const identNode = new IdentifierNode(
        this.scanner.getTokenOffset(),
        this.scanner.getTokenEnd(),
        [],
        void 0
      );

      let varName = this.scanner.getTokenText().trim();
      if (varName.startsWith("*")) {
        varName = varName.substring(1).trim(); // drop the star
        identNode.setAttribute("isArray", "true");
      } else if (hasStar) {
        identNode.setAttribute("isArray", "true");
      }

      identNode.name = varName;

      this.eatWhitespace();
      return identNode;
    }
  }

  private parseMaybeExpression(
    token: TokenType,
    parent: LPCNode,
    flags: ParseExpressionFlag
  ): LPCNode {
    //if (this.scanner.getTokenText() == "sprintf") debugger;

    let lh: LPCNode;
    if (token == TokenType.ArrayStart) {
      lh = this.parseArray(parent);
    } else if (token == TokenType.MappingStart) {
      lh = this.parseMapping(parent);
    } else if (token == TokenType.ParenBlock) {
      lh = this.parseParenBlock(parent, flags);
    } else {
      lh = this.parseExpression(token, parent, flags);
    }    

    // certain expressions can't have anything after them
    // return immediately
    if (lh.type == 'function') {
      return lh;
    }
    
    let tempTExt = this.scanner.getTokenText();
    this.eatWhitespaceAndNewlines();
    tempTExt = this.scanner.getTokenText();
    let tt = this.scanner.peek();

    if (tt == TokenType.IndexorStart) {
      // this can happen in the expression, and also after
      this.scanner.scan(); // consume [

      // wrap lh in a member expression
      const me = new MemberExpressionNode(
        this.scanner.getTokenOffset(),
        this.scanner.getTokenEnd(),
        [],
        void 0
      );
      me.object = lh;
      me.property = this.parseIndexorExpression();

      this.eatWhitespace();

      tt = this.scanner.peek();
      if (tt == TokenType.IndexorEnd) throw Error("Unexpected ]");

      lh = me;
    }

    tempTExt = this.scanner.getTokenText();
    switch (tt) {
      case TokenType.Comma:
        if (lh.type == "var-decl") {
          // multiple declarators in this variable declaration
          // otherwise let the comma go, its part of something else
          // (like an array of paren block)
          const decl = lh as VariableDeclarationNode;
          while (tt == TokenType.Comma) {
            this.scanner.scan(); // eat the comma
            this.eatWhitespace();

            const nextDecl = this.parseVariableDeclarator(decl);
            this.eatWhitespace();
            tt = this.scanner.peek();
          }

          return decl;
        }

        // otherwise, let it fall through to the parent parser
        break;
      case TokenType.Ternary:
        this.scanner.scan();
        const tern = this.parseTernary(lh);
        parent.children.push(tern);
        return tern;
      case TokenType.Operator:
      case TokenType.Star: // if star shows up here, treat it as an operator
        // binary expr
        this.scanner.scan();
        return this.parseBinaryExpression(lh, parent);
      case TokenType.AssignmentOperator:
        this.scanner.scan();
        const aExp = new AssignmentExpressionNode(
          this.scanner.getTokenOffset(),
          this.scanner.getTokenEnd(),
          [],
          parent
        );
        aExp.left = lh as IdentifierNode;
        aExp.operator = this.scanner.getTokenText().trim();

        parent.children.push(aExp);
        return this.parseAssignmentExpression(aExp, parent);
    }

    return lh;
  }

  private parseExpression(
    token: TokenType,
    parent: LPCNode,
    flags: ParseExpressionFlag
  ): LPCNode {
    const nd = new LPCNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );

    const allowDecl = !!(flags & ParseExpressionFlag.AllowDeclaration);
    const allowFn = !!(flags & ParseExpressionFlag.AllowFunction);

    const modNodes = this.parseModifiers();
    const typeNode = this.parseType();
    const hasStar = this.parseStar();    
    const identNode = this.parseIdentifier(hasStar);

    let tempTxt = this.scanner.getTokenText();

    let t: TokenType = this.scanner.peek();
    if (
      t == TokenType.ParenBlockEnd ||
      t == TokenType.Semicolon ||
      t == TokenType.Comma ||
      t == TokenType.IndexorEnd
    ) {
      // either a variable or a declaration
      // check disallow
      if (allowDecl) {
        const varDecl = new VariableDeclarationNode(
          nd.start,
          nd.end,
          [],
          parent
        );
        varDecl.varType = typeNode;
        varDecl.modifiers = modNodes;
        parent.children.push(varDecl);
        return this.parseVariableDeclaration(varDecl, parent, identNode);
      } else {
        if (modNodes.length > 0 || !!typeNode)
          throw Error(
            `did not expect mod or type at ${this.scanner.getTokenOffset()}`
          );
        if (!identNode) throw Error("expected ident");
        return identNode;
      }
    }
    if (t == TokenType.AssignmentOperator) {
      if (allowDecl && (typeNode || modNodes.length > 0)) {
        this.scanner.scan();
        // this is definitely a declaration
        // which means the assignment is an init
        const varDecl = new VariableDeclarationNode(
          nd.start,
          this.scanner.getTokenEnd(),
          [],
          parent
        );

        varDecl.varType = typeNode;
        varDecl.modifiers = modNodes;

        parent.children.push(varDecl);

        // get next token & parse the init expression
        t = this.scanner.scan();
        const initExp = this.parseToken(t, varDecl);

        return this.parseVariableDeclaration(
          varDecl,
          parent,
          identNode,
          initExp
        );
      }

      // if assignment op wasn't a variable init,
      // then let it fall through
    }
    if (t == TokenType.IndexorStart) {
      this.scanner.scan(); // consume [
      if (!identNode) throw "unexpector [ token without ident";
      // parse the next token into the ident property
      identNode.property = this.parseIndexorExpression();
      //identNode.property = this.parseToken(this.scanner.scan(), identNode);
      t = this.scanner.peek();
    }
    if (t == TokenType.IndexorEnd) {
      // indexor end should have been handled by parseIndexor
      throw Error(`unexpected ] symbol @ ${this.scanner.getTokenOffset()}`);
    }
    if (t == TokenType.Arrow) {
      this.scanner.scan();
      if (!identNode) throw "unexpected arrow w/o ident";
      return this.parseArrow(parent, identNode);
    }
    if (t == TokenType.ParenBlock) {
      this.scanner.scan();
      // paren block here means this is either a call exp
      // or a function decl
      if (!identNode) throw "got call-exp without ident node";
      const parenNode = this.parseParenBlock(
        nd,
        allowFn
          ? ParseExpressionFlag.AllowDeclaration
          : ParseExpressionFlag.StatementOnly
      );

      this.eatWhitespaceAndNewlines();

      if (this.scanner.peek() == TokenType.CodeBlockStart) {
        this.scanner.scan();
        // codeblock means the decl is a funciton declaration
        // and paren was function args
        if (!identNode) throw "expected ident node in function decl";
        if (!parenNode) throw "expected function args in function decl";

        const fd = new FunctionDeclarationNode(nd.start, nd.end, [], parent);
        parent.children.push(fd);

        fd.id = identNode;
        fd.varType = typeNode;
        fd.modifiers = modNodes;
        fd.params = [...parenNode.children];
        fd.codeBlock = this.parseCodeBlock(fd);

        return fd;
      } else {
        return this.parseCallExpression(
          parent,
          identNode,
          parenNode as ParenBlockNode
        );
      }
    }

    // if we get all the way down here, then it is just a variable
    // maybe used in an binop or as a call-exp arg
    if (!identNode)
      throw Error(`expected ident node @ ${this.scanner.getTokenOffset()}`);

    // don't push to parent.children in this case..
    // it will be handled by the parent directly
    return identNode;
  }

  private parseArray(parent: LPCNode) {
    const nd = new ArrayExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(nd);

    let t: TokenType;
    const children: LPCNode[] = [];
    while ((t = this.scanner.scan()) && t != TokenType.ArrayEnd) {
      if (t == TokenType.EOS) throw "unexpected eos while parsing array";

      if (
        t == TokenType.BlankLines ||
        t == TokenType.Whitespace ||
        t == TokenType.Comma
      )
        continue;

      pushIfVal(children, this.parseToken(t, nd));
      this.eatWhitespace();
    }

    nd.elements = children;
    return nd;
  }

  private parseIndexorExpression() {
    let t = this.scanner.scan();
    const ix = new IndexorExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      void 0
    );
    const children = [];
    while (t !== TokenType.IndexorEnd) {
      const tempText = this.scanner.getTokenText();
      if (t == TokenType.EOS)
        throw Error(
          `Unexpected EOS inside indexor [${this.scanner.getTokenOffset()}]`
        );
      if (t == TokenType.Comma) {
        // this is a hack.  use this to get commas in there for now
        const l = new IdentifierNode(
          this.scanner.getTokenOffset(),
          this.scanner.getTokenEnd(),
          [],
          void 0
        );
        l.name = ", ";
        children.push(l);
        this.eatWhitespace();
      } else if (
        t == TokenType.IndexorFromEndPos ||
        t == TokenType.IndexorPosSep
      ) {
        const i = new IdentifierNode(
          this.scanner.getTokenOffset(),
          this.scanner.getTokenEnd(),
          [],
          void 0
        );
        i.name = this.scanner.getTokenText().trim();
        children.push(i);
      } else {
        children.push(
          this.parseToken(t, ix, ParseExpressionFlag.StatementOnly)
        );
      }
      t = this.scanner.scan();
    }

    ix.children = children.filter((c) => !!c) as LPCNode[];
    return ix;
  }

  private parseMapping(parent: LPCNode) {
    const nd = new MappingExpressionNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(nd);

    let key: LPCNode | undefined;
    let val: LPCNode[] = [];

    let t: TokenType;
    while ((t = this.scanner.scan()) && t != TokenType.MappingEnd) {
      if (t == TokenType.EOS) throw "unexpected eos while parsing array";

      switch (t) {
        case TokenType.Comma:
          // start a new mapping entry
          if (!key) throw "got comma before seeing a mapping entry";
          nd.elements.push(new MappingPair(key, val));
          key = undefined;
          val = [];
          break;
        case TokenType.Semicolon:
        case TokenType.BlankLines:
        case TokenType.Colon:
          // just keep going
          break;
        default:
          if (!key) {
            key = this.parseToken(t, nd);
          } else {
            // new value
            const newNode = this.parseToken(t, nd);
            if (newNode) val.push(newNode);
          }
      }

      this.eatWhitespace();
    }

    if (key) {
      nd.elements.push(new MappingPair(key, val));
    }

    return nd;
  }

  /**
   * Parse a for keyword
   * for(<init>; <expr2>; <expr3>) statement;
   * @param parent
   */
  private parseFor(parent: LPCNode) {
    const nd = new ForStatementNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(nd);

    this.eatWhitespace();

    if (this.scanner.scan() != TokenType.ParenBlock)
      throw Error("expected opening paren");

    const stack: (LPCNode | undefined)[] = [];
    let t: TokenType,
      lastToken: TokenType = 0;

    while ((t = this.scanner.scan()) && t != TokenType.ParenBlockEnd) {
      if (t == TokenType.EOS) throw Error("Unexpected EOS in for statement");
      const tempText = this.scanner.getTokenText();

      if (t == TokenType.BlankLines || t == TokenType.Whitespace) continue;
      else if (t == TokenType.Semicolon)
        if (lastToken == t) stack.push(undefined);
        else continue;
      else stack.push(this.parseToken(t, nd));

      lastToken = t;
    }

    if (stack.length > 3)
      throw Error("Unexpected stack size in for statement " + stack.length);
    while (stack.length < 3) stack.push(undefined);

    // assign stack to for
    nd.init = stack[0];
    nd.test = stack[1];
    nd.update = stack[2];

    this.eatWhitespace();
    this.tryParseComment(nd);

    let tempText = this.scanner.getTokenText();
    this.scanner.eat(TokenType.BlankLines);
    this.scanner.eat(TokenType.Whitespace);

    // this.scanner.peek();
    // tempText = this.scanner.getTokenText();
    nd.codeblock = this.parseToken(this.scanner.scan(), nd);
    this.scanner.eat(TokenType.BlankLines);

    return nd;
  }

  /**
   * Parse a while loop
   * while(<expr>) statement;
   * @param parent
   */
  private parseWhile(parent: LPCNode) {
    const nd = new WhileStatementNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );
    parent.children.push(nd);

    this.eatWhitespace();

    if (this.scanner.scan() != TokenType.ParenBlock)
      throw Error("expected opening paren");

    nd.test = this.parseParenBlock(nd, ParseExpressionFlag.StatementOnly);

    this.eatWhitespace();
    this.tryParseComment(nd);
    this.eatWhitespaceAndNewlines();
    //this.scanner.eat(TokenType.BlankLines);

    let t = this.scanner.scan();
    const tempText = this.scanner.getTokenText();
    if (t == TokenType.CodeBlockStart) nd.codeblock = this.parseCodeBlock(nd);
    else {
      nd.codeblock = this.parseToken(
        t,
        nd,
        ParseExpressionFlag.AllowDeclaration
      );
    }

    return nd;
  }

  private parseSwitch(parent: LPCNode) {
    const switchNode = new SwitchNode(
      this.scanner.getTokenOffset(),
      this.scanner.getTokenEnd(),
      [],
      parent
    );

    if (this.scanner.scan() != TokenType.ParenBlock) {
      throw Error(
        `Expected ( got '${this.scanner.getTokenText()}' @ ${this.scanner.getTokenOffset()}`
      );
    }

    switchNode.test = this.parseParenBlock(
      switchNode,
      ParseExpressionFlag.StatementOnly
    ) as ParenBlockNode;
    this.eatWhitespaceAndNewlines();
    this.tryParseComment(switchNode.test!);

    if (this.scanner.scan() != TokenType.CodeBlockStart)
      throw Error(
        `Expected { got '${this.scanner.getTokenText()}' @ ${this.scanner.getTokenOffset()}`
      );

    this.eatWhitespaceAndNewlines();
    while (this.scanner.scan() != TokenType.CodeBlockEnd) {
      const t = this.scanner.getTokenType();
      if (t == TokenType.EOS) throw Error("Unexpected EOS in switch case");
      if (t == TokenType.SwitchCase) {
        const caseNode = new SwitchCaseNode(
          this.scanner.getTokenOffset(),
          this.scanner.getTokenEnd(),
          [],
          switchNode
        );
        const caseType = (caseNode.caseType = this.scanner
          .getTokenText()
          .trim());

        if (caseType == "case") {
          caseNode.expression = this.parseToken(
            this.scanner.scan(),
            caseNode,
            ParseExpressionFlag.StatementOnly
          );
          this.eatWhitespace();
          if (this.scanner.scan() != TokenType.Colon)
            throw Error(`Expected colon at ${this.scanner.getTokenOffset()}`);
          this.eatWhitespace();
          this.tryParseComment(caseNode);
        }

        const cb = this.parseSwitchCase(caseNode);
        caseNode.code = cb;

        if (caseType == "case") switchNode.cases.push(caseNode);
        else switchNode.default = cb;
      } else {
        throw Error(
          `Unexpected token in switch case at ${this.scanner.getTokenOffset()}`
        );
      }
    }

    return switchNode;
  }

  private parseSwitchCase(caseNode: SwitchCaseNode) {
    const cb = new CodeBlockNode(0, 0, [], caseNode);
    const children: LPCNode[] = [];
    while (this.scanner.peek()) {
      const t = this.scanner.getTokenType();
      if (t == TokenType.CodeBlockEnd || t == TokenType.SwitchCase) {
        break; // this is handled by parent
      }

      this.scanner.scan();
      if (t == TokenType.EOS) throw Error("Unexpected EOS in switch case");

      pushIfVal(
        children,
        this.parseToken(t, cb, ParseExpressionFlag.AllowDeclaration)
      );
    }

    cb.children = children;

    // remove blanklines from end
    while (cb.children.length > 0 && last(cb.children)?.type == "blankline")
      cb.children.pop();

    return cb;
  }
}
