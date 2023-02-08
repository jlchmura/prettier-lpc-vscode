import { last } from "../utils/arrays";
import {
  arrith_ops,
  assignment_ops,
  binary_ops,
  logical_ops,
  tt,
  typesSet,
} from "./defs";
import { ScannerState, TokenType } from "./lpcLanguageTypes";
import { MultiLineStream } from "./MultiLineStream";

export interface IScanner {
  scan(): TokenType;
  peek(): TokenType;
  getTokenType(): TokenType;
  getTokenOffset(): number;
  getTokenLength(): number;
  getTokenEnd(): number;
  getTokenText(): string;
  getTokenError(): string | undefined;
  getScannerState(): ScannerState;
  didTokenStartOnOwnLine(): boolean;
}

export const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
export const word = /[a-zA-Z][\w]*/g;

export class Scanner implements IScanner {
  readonly stateStack: ScannerState[] = [];

  readonly stream: MultiLineStream;
  peekToken: TokenType = TokenType.None;
  state: ScannerState;
  tokenOffset: number = 0;
  tokenType: TokenType = TokenType.Unknown;
  tokenError: string | undefined;
  lastLiteral: string | undefined;
  lastState: ScannerState | undefined;

  lastVar: string | undefined;
  lastTypeValue: string | undefined;

  parenStack: TokenType[] = [];

  constructor(
    public input: string,
    initialOffset: number = 0,
    initialState = ScannerState.WithinFile
  ) {
    this.stream = new MultiLineStream(input, initialOffset);
    this.state = initialState;
  }

  public nextTokenStart(): number {
    return this.nextTokenStartSince(this.stream.pos());
  }

  nextTokenStartSince(pos: number): number {
    skipWhiteSpace.lastIndex = pos;
    return skipWhiteSpace.test(this.input) ? skipWhiteSpace.lastIndex : pos;
  }

  lookaheadCharCode(): number {
    return this.input.charCodeAt(this.nextTokenStart());
  }

  public nextWord(): string {
    return this.stream.advanceIfWordNonReserved();
  }

  public peekWord(): string | undefined {
    word.lastIndex = this.stream.pos();
    const match = word.exec(this.input);
    if (!!match) return match[0];
    else return undefined;
  }

  public isAlpha(char: number) {
    return (char >= 65 && char <= 90) || (char >= 97 && char <= 122);
  }

  public isSpace(char: number) {
    return char == tt._WSP || char == tt._TAB;
  }

  public isNumber(char: number) {
    return char >= 48 && char <= 57;
  }

  public finishToken(
    offset: number,
    type: TokenType,
    errorMessage?: string
  ): TokenType {
    this.tokenType = type;
    this.tokenOffset = offset;
    this.tokenError = errorMessage;
    return type;
  }

  public parseComments(): TokenType {
    const offset = this.stream.pos();

    if (this.stream.advanceIfChars([tt._FSL, tt._FSL])) {
      // single-line comment
      if (this.stream.advanceUntilChar(tt._NWL)) {
        this.stream.advance(1); // eat the \n char
        return this.finishToken(offset, TokenType.Comment);
      }

      return this.finishToken(
        offset,
        TokenType.Comment,
        "malformed single line comment"
      );
    } else if (this.stream.advanceIfChars([tt._FSL, tt._STR])) {
      // multi-line comment
      this.stateStack.push(this.state);
      this.state = ScannerState.WithinCommentBlock;
      return this.finishToken(offset, TokenType.StartCommentBlock);
    }

    return TokenType.None;
  }

  public parseOperators(): TokenType {
    // operators
    switch (this.stream.peekChar()) {
      case tt._EQS:
      case tt._BNG:
      case tt._LAN:
      case tt._RAN:
      case tt._PIP:
      case tt._AMP:
      case tt._PLS:
      case tt._MNS:
      case tt._FSL:
      case tt._STR:
        if (binary_ops.some((op) => this.stream.advanceIfChars(op))) {
          this.stream.skipWhitespace();
          return TokenType.Operator;
        }
        if (logical_ops.some((op) => this.stream.advanceIfChars(op))) {
          this.stream.skipWhitespace();
          return TokenType.LogicalOperator;
        }
        if (assignment_ops.some((op) => this.stream.advanceIfChars(op))) {
          this.stream.skipWhitespace();
          return TokenType.AssignmentOperator;
        }
        if (arrith_ops.some((op) => this.stream.advanceIfChars(op))) {
          this.stream.skipWhitespace();
          return TokenType.Operator;
        }
    }
    return TokenType.None;
  }

  /** peeks the next token and if it matches the token paren, will consume it
   * otherwise does nothing.
   */
  public eat(token: TokenType): boolean {
    if (this.peek() == token) {
      this.scan();
      return true;
    } else {
      return false;
    }
  }

  public scan(): TokenType {
    if (this.peekToken != TokenType.None) {
      const temp = this.peekToken;
      this.peekToken = TokenType.None;
      return temp;
    }

    const offset = this.stream.pos();
    const oldState = this.state;
    const token = this.internalScan();
    if (token !== TokenType.EOS && offset === this.stream.pos()) {
      console.warn(
        `Scanner.scan has not advanced at offset ${offset}, state before: ${oldState} after: ${this.state}`
      );
      this.stream.advance(1);
      return this.finishToken(offset, TokenType.Unknown);
    }
    return token;
  }

  public peek(): TokenType {
    return (this.peekToken = this.scan());
  }

  public internalScan(): TokenType {
    const offset = this.stream.pos();
    if (this.stream.eos()) {
      return this.finishToken(offset, TokenType.EOS);
    }
    let errorMessage;
    let comment: TokenType = TokenType.None;

    switch (this.state) {
      case ScannerState.WithinFile:
        if (this.stream.skipBlankLines()) {
          return this.finishToken(offset, TokenType.BlankLines);
        }
      // fall through to block
      case ScannerState.WithinBlock:        
        // directives must be at the start of a line
        if (this.stream.advanceIfChar(tt._HSH)) {
          // start of a closure
          if (this.stream.advanceIfChar(tt._SQO)) {
            return this.finishToken(offset, TokenType.Closure);
          }
          
          // not a closure so it must be a directive
          if (this.stream.advanceIfDirective()) {
            this.state = ScannerState.StartDirective;

            return this.finishToken(offset, TokenType.Directive);
          }
        }

        // whitespace does not impact anything else at the file level
        if (this.stream.skipWhitespace(false)) {
          return this.finishToken(offset, TokenType.Whitespace);
        }

        if ((comment = this.parseComments())) {
          return comment;
        }

        if (this.stream.advanceIfChar(tt._STR)) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.Star);
        }

        let wrd: string;
        if ((wrd = this.stream.advanceIfModifier())) {
          return this.finishToken(offset, TokenType.Modifier);
        }
        if ((wrd = this.stream.advanceIfType())) {
          return this.finishToken(offset, TokenType.Type);
        }
        if ((wrd = this.nextWord())) {
          return this.finishToken(offset, TokenType.DeclarationName);
        }

        if (this.stream.advanceIfChars(tt._INHERIT)) {
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.Inherit);
        }

        // IF BLOCKS
        if (this.stream.advanceIfChars(tt._IF)) {
          this.state = ScannerState.IfExpression;
          return this.finishToken(offset, TokenType.If);
        }
        if (this.stream.advanceIfChars(tt._ELSEIF)) {
          this.state = ScannerState.ElseIfExpression;
          return this.finishToken(offset, TokenType.ElseIf);
        }
        if (this.stream.advanceIfChars(tt._ELSE)) {
          this.state = ScannerState.ElseExpression;
          return this.finishToken(offset, TokenType.Else);
        }

        // LOOPS
        if (this.stream.advanceIfChars(tt._FOREACH)) {
          throw Error("FOREACH not handled yet");
        }
        if (this.stream.advanceIfChars(tt._FOR)) {
          return this.finishToken(offset, TokenType.For);
        }
        if (this.stream.advanceIfChars(tt._WHILE)) {
          return this.finishToken(offset, TokenType.While);
        }

        // LOOP CONTROL FLOW
        if (
          this.stream.advanceIfChars(tt._BREAK) ||
          this.stream.advanceIfChars(tt._CONTINUE)
        ) {
          return this.finishToken(offset, TokenType.ControlFlow);
        }

        this.stream.skipWhitespace();

        if (this.stream.advanceIfChars(tt._RETURN)) {
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.Return);
        }

        if (this.stream.advanceIfChars(tt._SWITCH)) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.Switch);
        }
        if (
          this.stream.advanceIfChars(tt._CASE) ||
          this.stream.advanceIfChars(tt._DEFAULT)
        ) {
          this.stream.skipWhitespace();

          this.stream.advanceIfChar(tt._COL);
          return this.finishToken(offset, TokenType.SwitchCase);
        }

        // ARRAY
        if (this.stream.advanceIfChars([tt._OPP, tt._OBK])) {
          // ({
          this.stream.skipWhitespace();
          this.parenStack.push(TokenType.ArrayStart);
          return this.finishToken(offset, TokenType.ArrayStart);
        }
        if (
          this.testParenStack(TokenType.ArrayStart) &&
          this.stream.advanceIfChars([tt._CBK, tt._CLP])
        ) {
          // })
          this.parenStack.pop();
          return this.finishToken(offset, TokenType.ArrayEnd);
        }

        // MAPPING
        if (this.stream.advanceIfChars([tt._OPP, tt._OSB])) {
          // ([
          this.stream.skipWhitespace();
          this.parenStack.push(TokenType.MappingStart);
          return this.finishToken(offset, TokenType.MappingStart);
        }
        if (
          this.testParenStack(TokenType.MappingStart) &&
          this.stream.advanceIfChars([tt._CSB, tt._CLP])
        ) {
          // ])
          this.parenStack.pop();
          return this.finishToken(offset, TokenType.MappingEnd);
        }

        if (this.stream.advanceIfChar(tt._COM)) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.Comma);
        }

        if (this.stream.advanceIfChar(tt._OPP)) {
          // first check if its a type cast
          const nextWord = this.peekWord();
          if (
            !!nextWord &&
            typesSet.has(nextWord) &&
            this.stream.peekChar(nextWord.length) == tt._CLP
          ) {
            this.nextWord();
            if (this.stream.advanceIfChar(tt._CLP))
              return this.finishToken(offset, TokenType.TypeCast);
            else
              return this.finishToken(
                offset,
                TokenType.Unknown,
                "Malfored type cast"
              );
          }

          // (
          this.parenStack.push(TokenType.ParenBlock);
          return this.finishToken(offset, TokenType.ParenBlock);
        }
        if (
          this.testParenStack(TokenType.ParenBlock) &&
          this.stream.advanceIfChar(tt._CLP)
        ) {
          // )
          this.parenStack.pop();
          return this.finishToken(offset, TokenType.ParenBlockEnd);
        }

        if (this.stream.advanceIfChar(tt._OSB)) {
          // [
          return this.finishToken(offset, TokenType.IndexorStart);
        }
        if (this.stream.advanceIfChar(tt._CSB)) {
          // ]
          return this.finishToken(offset, TokenType.IndexorEnd);
        }
        if (
          this.stream.peekChar(-1) == tt._OSB &&
          this.stream.advanceIfChar(tt._LAN)
        ) {
          return this.finishToken(offset, TokenType.IndexorFromEndPos);
        }
        if (
          this.stream.peekChar(-1) == tt._DOT &&
          this.stream.peekChar(-2) == tt._DOT &&
          this.stream.advanceIfChar(tt._LAN)
        ) {
          return this.finishToken(offset, TokenType.IndexorFromEndPos);
        }
        if (this.stream.advanceIfChars([tt._DOT, tt._DOT])) {
          return this.finishToken(offset, TokenType.IndexorPosSep);
        }

        if (this.stream.advanceIfChars([tt._COL, tt._COL])) {
          // :: (inheritance)
          this.stream.skipWhitespace();
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.InheritanceAccessor);
        }

        if (this.stream.advanceIfChar(tt._SEM)) {
          // ;
          this.stream.skipWhitespace(false);
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.Semicolon);
        }
        if (this.stream.advanceIfChar(tt._COL)) {
          // :
          this.stream.skipWhitespace();
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.Colon);
        }        

        if (
          this.stream.peekChar() == tt._DQO ||
          this.stream.peekChar() == tt._SQO
        ) {
          // " or '
          this.state = ScannerState.WithinLiteral;
          return this.internalScan();
        }

        if (this.isNumber(this.stream.peekChar())) {
          if (this.stream.advanceIfRegExp(/^\d[\d\.]*/)) {
            return this.finishToken(offset, TokenType.LiteralNumber);
          }
        }

        if (this.stream.advanceIfChar(tt._OBK)) {
          // {
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.CodeBlockStart);
        }
        if (this.stream.advanceIfChar(tt._CBK)) {
          // }
          this.state = ScannerState.WithinFile;
          this.stream.skipWhitespace(false);
          return this.finishToken(offset, TokenType.CodeBlockEnd);
        }

        if (this.stream.advanceIfChars(tt._CALLOTHER)) {
          //this.state = ScannerState.WithinFunction;
          return this.finishToken(offset, TokenType.Arrow);
        }

        const opTkn = this.parseOperators();
        if (opTkn) return this.finishToken(offset, opTkn);

        if (this.stream.advanceIfChar(tt._QUE)) {
          return this.finishToken(offset, TokenType.Ternary);
        }

        return this.finishToken(offset, TokenType.Unknown);
      case ScannerState.StartInherit:
        this.stream.skipWhitespace();

        if (this.stream.advanceIfChar(tt._SEM)) {
          this.stream.advanceToEndOfLine();
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.Semicolon);
        }
        if (this.stream.advanceIfChar(tt._OPP)) {
          //this.state = ScannerState.WithinParen;
          return this.internalScan();
        }
        if (this.stream.peekChar() == tt._DQO) {
          this.state = ScannerState.WithinLiteral;
          return this.internalScan();
        }

        return this.finishToken(
          offset,
          TokenType.Unknown,
          "Malformed inherit statement."
        );
      case ScannerState.WithinLiteral:
        this.stream.skipWhitespace();
        if (
          this.stream.advanceIfChar(tt._DQO) &&
          this.stream.advanceUntilUnescapedQuote()
        ) {
          this.stream.advance(1);
          this.stream.skipWhitespace();
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.Literal);
        }
        if (this.stream.advanceIfChar(tt._SQO)) {
          this.stream.advance(1);
          if (!this.stream.advanceIfChar(tt._SQO))
            throw Error(`Expected single quote at [${this.stream.pos()}]`);
          this.stream.skipWhitespace();
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.LiteralChar);
        }
        return this.finishToken(
          offset,
          TokenType.Unknown,
          "Malformed string literal"
        );
      case ScannerState.StartDirective:
        if (this.stream.advanceIfRegExp(/^[a-zA-Z\w]*/)) {
          this.state = ScannerState.WithinDirective;
          return this.finishToken(offset, TokenType.DirectiveArgument);
        }
      // fall through
      case ScannerState.WithinDirective:
        if (
          this.stream.advanceIfChar(tt._BSL) &&
          this.stream.advanceToEndOfLine()
        ) {
          // directive continues on the next line.
          return this.finishToken(offset, TokenType.DirectiveLineBreak);
        }

        if (this.stream.advanceIfChar(tt._NWL)) {
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.DirectiveEnd);
        }

        if (this.stream.advanceUntilRegExp(/[\\\n]/)) {
          return this.finishToken(offset, TokenType.DirectiveArgument);
        }

        return this.finishToken(offset, TokenType.Unknown, "Malformed literal");
      case ScannerState.WithinCommentBlock:
        if (this.stream.advanceUntilChars([tt._STR, tt._FSL])) {
          this.stream.advance(2);
          this.stream.advanceToEndOfLine();
          this.state = this.stateStack.pop() || ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.EndCommentBlock);
        }
        return this.finishToken(
          offset,
          TokenType.Unknown,
          "Could not find end of comment block"
        );
      case ScannerState.WithinFunctionArgs:
        if (this.stream.advanceIfType()) {
          return this.finishToken(offset, TokenType.FunctionArgumentType);
        }
        if (this.stream.advanceIfWord()) {
          return this.finishToken(offset, TokenType.FunctionArgument);
        }
        if (this.stream.advanceIfChar(tt._CLP)) {
          this.state = ScannerState.WithinFunction;
          return this.finishToken(offset, TokenType.FunctionArgumentEnd);
        }
        break;
      case ScannerState.WithinFunction:
        this.stream.skipWhitespace();
        if ((comment = this.parseComments())) {
          return comment;
        }

        if (this.stream.advanceIfChar(tt._OBK)) {
          // {
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.CodeBlockStart);
        }
        break;
      case ScannerState.IfExpression:
      case ScannerState.ElseIfExpression:
      case ScannerState.ElseExpression:
        this.stream.skipWhitespace();

        if ((comment = this.parseComments())) {
          return comment;
        }

        if (this.stream.peekChar() == tt._OPP) {
          this.state = ScannerState.WithinFile;
          return this.internalScan();
        } else if (this.stream.peekChar() == tt._CLP) {
          this.state = ScannerState.WithinFile;
          return this.internalScan();
        } else if (this.stream.advanceIfChars([tt._EQS, tt._EQS])) {
          return this.finishToken(offset, TokenType.Operator);
        } else {
          this.state = ScannerState.WithinFile;
          return this.internalScan();
        }

        return this.finishToken(
          offset,
          TokenType.Unknown,
          "Expected expression."
        );
    }

    this.stream.advance(1);
    this.state = ScannerState.WithinFile;
    return this.finishToken(offset, TokenType.Unknown, errorMessage);
  }

  /**
   * checks to see if this token started on its own line
   */
  public didTokenStartOnOwnLine(): boolean {
    // start at the beginning of the token and
    // walk backward past whitespace to see if this comment started on its own line
    let peekPos = -(this.stream.pos() - this.tokenOffset) - 1;
    let peekChar = this.stream.peekChar(peekPos--);
    while (this.stream.pos() - peekPos >= 0 && this.isSpace(peekChar)) {
      peekChar = this.stream.peekChar(peekPos--);
    }
    return peekChar == tt._NWL;
  }

  public getTokenType() {
    return this.tokenType;
  }
  public getTokenOffset() {
    return this.tokenOffset;
  }
  public getTokenLength() {
    return this.stream.pos() - this.tokenOffset;
  }
  public getTokenEnd() {
    return this.stream.pos();
  }
  public getTokenText() {
    return this.stream
      .getSource()
      .substring(this.tokenOffset, this.stream.pos());
  }
  public getScannerState() {
    return this.state;
  }
  public getTokenError() {
    return this.tokenError;
  }

  private testParenStack(token: TokenType) {
    return last(this.parenStack) == token;
  }
}
