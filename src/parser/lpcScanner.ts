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
export const typeCastWord = /[a-zA-Z][\w]*\s*\*?\s*\)/g;

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

  lookBackCharCode(): number {
    let i = this.stream.pos() - 1;
    let char: number = 0;
    while ((char = this.stream.peekChar(i--))) {
      if (
        char != tt._NWL &&
        char != tt._WSP &&
        char != tt._TAB &&
        char != tt._CAR &&
        char != tt._LFD
      ) {
        return char;
      }
    }
    return 0;
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
    if (!!match && match.index == this.stream.pos()) return match[0];
    else return undefined;
  }

  public peekTypeCastWord(): string | undefined {
    typeCastWord.lastIndex = this.stream.pos();
    const match = typeCastWord.exec(this.input);
    if (!!match && match.index == this.stream.pos()) return match[0];
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
      case tt._PCT:
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

    const txt = this.stream.remaining_source;

    switch (this.state) {
      case ScannerState.WithinFile:
      case ScannerState.WithinLambda:
        if (this.stream.skipBlankLines()) {
          return this.finishToken(offset, TokenType.BlankLines);
        }
      // fall through to block
      case ScannerState.WithinBlock:
        // directives must be at the start of a line
        if (this.stream.advanceIfChar(tt._HSH)) {
          // start of a closure
          if (this.stream.advanceIfChar(tt._SQO)) {
            // '[ - lambda indexor
            if (this.stream.advanceIfChar(tt._OSB)) {
              // there are only a set number of chars at this point, so grab them all
              this.stream.advanceIfChar(tt._LAN);
              this.stream.advanceIfChars([tt._DOT, tt._DOT]);
              this.stream.advanceIfChar(tt._LAN);
              this.stream.advanceIfChars([tt._COM, tt._CSB]); // comma must have a closing bracket after it
              this.stream.advanceIfChar(tt._CSB);

              this.stream.skipWhitespace();

              return this.finishToken(offset, TokenType.LambdaIndexor);
            }

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

        // LAMBDA
        if (this.stream.advanceIfChars(tt._LAMBDA)) {
          this.stream.skipWhitespace();
          if (this.stream.advanceIfChar(tt._OPP)) {
            // lambda(
            this.parenStack.push(TokenType.LambdaStart);
            this.state = ScannerState.WithinLambda;
            return this.finishToken(offset, TokenType.LambdaStart);
          } else {
            throw Error(`Expected ( after lambda @ ${offset}`);
          }
        }
        if (
          this.testParenStack(TokenType.LambdaStart) &&
          this.stream.advanceIfChar(tt._CLP)
        ) {
          this.parenStack.pop();
          this.state = ScannerState.WithinFile;
          return this.finishToken(offset, TokenType.LabmdaEnd);
        }

        if (this.stream.advanceIfChar(tt._STR)) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.Star);
        }

        if (this.stream.advanceIfChars(tt._SPREAD)) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.Spread);
        }

        // FOREACH
        if (this.stream.advanceIfChars(tt._FOREACH)) {
          this.stream.skipWhitespace();
          if (this.stream.advanceIfChar(tt._OPP)) {
            this.parenStack.push(TokenType.ForEach);
            return this.finishToken(offset, TokenType.ForEach);
          }
          return this.finishToken(
            offset,
            TokenType.ForEach,
            "Unexpected token after foreach"
          );
        }
        // foreach : or "in"
        if (
          this.testParenStack(TokenType.ForEach) &&
          (this.stream.advanceIfChar(tt._COL) ||
            this.stream.advanceIfChars(tt._IN))
        ) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.ForEachIn);
        }

        // foreach range ".."
        if (
          this.testParenStack(TokenType.ForEach) &&
          this.stream.advanceIfChars([tt._DOT, tt._DOT])
        ) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.ForEachRange);
        }

        if (
          this.testParenStack(TokenType.ForEach) &&
          this.stream.advanceIfChar(tt._CLP)
        ) {
          this.parenStack.pop();
          return this.finishToken(offset, TokenType.ParenBlockEnd);
        }

        // WORDS: MODIFIERS, TYPES, AND DECLARATIONS
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

        // STRUCT
        if (
          this.stream.peekChar() == tt._LAN &&
          this.isAlpha(this.stream.peekChar(1)) &&
          this.stream.advanceIfRegExp(/^\<\w+\>/)
        ) {
          return this.finishToken(offset, TokenType.StructLiteral);
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

        // INLINE CLOSURES
        if (this.stream.peekChar(tt._OPP)) {
          this.stream.skipWhitespace;
        }

        if (this.stream.advanceIfRegExp(/^\(\s*\:/)) {
          // (:  use regex to account for space between tokens
          this.stream.skipWhitespace();
          this.parenStack.push(TokenType.InlineClosureStart);
          return this.finishToken(offset, TokenType.InlineClosureStart);
        }
        if (
          this.testParenStack(TokenType.InlineClosureStart) &&
          this.stream.advanceIfChars([tt._COL, tt._CLP])
        ) {
          // :)
          this.parenStack.pop();
          return this.finishToken(offset, TokenType.InlineClosureEnd);
        }

        // inline closure argument
        if (this.stream.advanceIfRegExp(/^\$\d+/)) {
          return this.finishToken(offset, TokenType.InlineClosureArgument);
        }

        // match single $ for Fluffos $() syntax
        if (this.stream.advanceIfChar(tt._DLR)) {
          return this.finishToken(offset, TokenType.DeclarationName);
        }

        if (this.stream.advanceIfChar(tt._COM)) {
          this.stream.skipWhitespace();
          return this.finishToken(offset, TokenType.Comma);
        }

        if (this.stream.advanceIfChar(tt._OPP)) {
          this.stream.skipWhitespace();
          // first check if its a type cast
          const nextWord = this.peekTypeCastWord();
          word.lastIndex = 0;
          const typeWord = nextWord ? word.exec(nextWord)?.[0] : undefined;

          if (!!nextWord && !!typeWord && typesSet.has(typeWord)) {
            this.stream.advance(nextWord.length);

            return this.finishToken(offset, TokenType.TypeCast);
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
          this.parenStack.push(TokenType.IndexorStart);
          return this.finishToken(offset, TokenType.IndexorStart);
        }
        if (this.stream.advanceIfChar(tt._CSB)) {
          // ]
          if (last(this.parenStack) != TokenType.IndexorStart) {
            throw Error(`Expected indexor start on stack @ ${this.stream.pos}`);
          }
          this.parenStack.pop();
          return this.finishToken(offset, TokenType.IndexorEnd);
        }
        if (
          this.testParenStack(TokenType.IndexorStart) &&
          (this.stream.advanceIfChar(tt._LAN) ||
            this.stream.advanceIfChar(tt._RAN))
        ) {
          return this.finishToken(offset, TokenType.IndexorFromEndPos);
        }
        if (
          this.stream.peekChar(-1) == tt._DOT &&
          this.stream.peekChar(-2) == tt._DOT &&
          (this.stream.advanceIfChar(tt._LAN) ||
            this.stream.advanceIfChar(tt._RAN))
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

        // 'o - lambda empty argument
        if (this.stream.advanceIfChars([tt._SQO, "o".charCodeAt(0)])) {
          return this.finishToken(offset, TokenType.LambdaEmptyArg);
        }

        if (
          this.stream.peekChar() == tt._DQO ||
          this.stream.peekChar() == tt._SQO
        ) {
          // " or '
          this.state = ScannerState.WithinLiteral;
          return this.internalScan();
        }

        //FluffOS string literal blocks (i.e. @FOO ... FOO)
        if (this.stream.advanceIfChar(tt._AT)) {
          this.stream.advanceIfChar(tt._AT); // handle @@ too
          this.lastLiteral = this.stream.advanceIfWord();
          this.state = ScannerState.WithinStringLiteralBlock;
          return this.finishToken(offset, TokenType.StringLiteralStart);
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
          // might be a char, might be a lambda func call
          if (this.stream.peekChar(1) == tt._SQO) {
            // literal char
            this.stream.advance(1);
            if (!this.stream.advanceIfChar(tt._SQO))
              throw Error(`Expected single quote at [${this.stream.pos()}]`);
            this.stream.skipWhitespace();
            this.state = ScannerState.WithinFile;
            return this.finishToken(offset, TokenType.LiteralChar);
          } else {
            // lambda call
            const litWord = this.nextWord();
            if (litWord) {
              this.state = ScannerState.WithinLambda;
              return this.finishToken(offset, TokenType.DeclarationName);
            }

            throw Error(`Unrecognized char after single quote @ ${offset}`);
          }
        }
        return this.finishToken(
          offset,
          TokenType.Unknown,
          "Malformed string literal"
        );
      case ScannerState.WithinStringLiteralBlock:
        if (!this.lastLiteral) {
          throw "State was within string literal but there was no literal marker";
        }
        this.stream.advanceUntilChars(
          ("\n" + this.lastLiteral).split("").map((c) => c.charCodeAt(0))
        );
        this.stream.advance(this.lastLiteral.length + 1);

        this.state = ScannerState.WithinFile;

        return this.finishToken(offset, TokenType.StringLiteralBody);
      case ScannerState.StartDirective:
        const txt = this.stream.remaining_source;
        if (this.stream.advanceIfRegExp(/^\w+(?:\(\w+\))?/)) {
          this.state = ScannerState.WithinDirectiveArg;
          return this.finishToken(offset, TokenType.DirectiveArgument);
        }
      // fall through
      case ScannerState.WithinDirectiveArg:
        this.stream.skipWhitespace(false);

        if (
          this.stream.advanceWhile((p) => {
            const c0 = this.stream.charAt(p),
              c1 = this.stream.charAt(p + 1);
            return (
              c0 != tt._NWL &&
              !(c0 == tt._BSL && (this.isSpace(c1) || c1 == tt._NWL))
            );
          })
        ) {
          this.state = ScannerState.WithinDirectiveArg;
          return this.finishToken(offset, TokenType.DirectiveArgument);
        }

        if (
          this.stream.advanceIfChar(tt._BSL) &&
          this.stream.advanceToEndOfLine()
        ) {
          const tt = this.stream.remaining_source;
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

  private isInLambda() {
    return this.parenStack.some((s) => s == TokenType.LambdaStart);
  }
}
