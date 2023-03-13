import {
  directives,
  directive_chars,
  modifiers_set,
  reserved_words_set,
  tt,
  typesSet,
} from "./defs";

export class MultiLineStream {
  private source: string;
  private len: number;
  private position: number;
  public get remaining_source() {
    return this.source.substring(this.position);
  }

  constructor(source: string, position: number) {
    this.source = source;
    this.len = source.length;
    this.position = position;
  }

  public eos(): boolean {
    return this.len <= this.position;
  }

  public getSource(): string {
    return this.source;
  }

  public pos(): number {
    return this.position;
  }

  public goBackTo(pos: number): void {
    this.position = pos;
  }

  public goBack(n: number): void {
    this.position -= n;
  }

  public advance(n: number): void {
    this.position += n;
  }

  public goToEnd(): void {
    this.position = this.source.length;
  }

  public nextChar(): number {
    return this.source.charCodeAt(this.position++) || 0;
  }

  public peekChar(n: number = 0): number {
    return this.source.charCodeAt(this.position + n) || 0;
  }

  public advanceIfChar(ch: number): boolean {
    if (ch === this.source.charCodeAt(this.position)) {
      this.position++;
      return true;
    }
    return false;
  }

  public advanceIfChars(ch: number[]): boolean {
    let i: number;
    if (this.position + ch.length > this.source.length) {
      return false;
    }
    for (i = 0; i < ch.length; i++) {
      if (this.source.charCodeAt(this.position + i) !== ch[i]) {
        return false;
      }
    }
    this.advance(i);
    return true;
  }

  public advanceIfWord(): string {
    return this.advanceIfRegExp(/^(?!return\s)[_a-zA-Z][\w]*/);
  }

  public advanceIfDirective(): string {
    for (let i = 0; i < directive_chars.length; i++) {
      if (this.advanceIfChars(directive_chars[i])) {
        this.advanceWhileChar((c) => c == tt._WSP);
        return directives[i] || "";
      }
    }
    return "";
  }

  public advanceIfRegExp(regex: RegExp): string {
    const str = this.source.substring(this.position);
    const match = str.match(regex);
    if (match) {
      this.position = this.position + match.index! + match[0].length;
      return match[0];
    }
    return "";
  }

  public advanceIfWordWithTest(test: (matches: RegExpMatchArray) => boolean) {
    const reg = /^[_a-zA-Z][\w_]*\b/;
    const str = this.source.substring(this.position);
    const match = str.match(reg);
    if (match && test(match)) {
      this.position = this.position + match.index! + match[0].length;
      return match[0];
    }
    return "";
  }

  public advanceIfModifier(): string {
    return this.advanceIfWordWithTest((match) =>
      modifiers_set.has(match[0])
    );
  }

  public advanceIfType(): string {
    return this.advanceIfWordWithTest((match) =>
      typesSet.has(match[0])
    );
  }

  public advanceIfWordNonReserved(): string {
    return this.advanceIfWordWithTest(
      (match) => !reserved_words_set.has(match[0].toLowerCase())
    );
  }

  public advanceUntilRegExp(regex: RegExp): string {
    const str = this.source.substr(this.position);
    const match = str.match(regex);
    if (match) {
      this.position = this.position + match.index!;
      return match[0];
    } else {
      this.goToEnd();
    }
    return "";
  }

  public advanceUntilChar(ch: number): boolean {
    while (this.position < this.source.length) {
      if (this.source.charCodeAt(this.position) === ch) {
        return true;
      }
      this.advance(1);
    }
    return false;
  }

  public advanceUntilUnescapedQuote(): boolean {
    while (this.position < this.source.length) {
      if (
        this.source.charCodeAt(this.position) === tt._DQO &&
        this.source.charCodeAt(this.position - 1) !== tt._BSL
      ) {
        return true;
      }
      this.advance(1);
    }
    return false;
  }

  public advanceUntilChars(ch: number[]): boolean {
    while (this.position + ch.length <= this.source.length) {
      let i = 0;
      for (
        ;
        i < ch.length && this.source.charCodeAt(this.position + i) === ch[i];
        i++
      ) {}
      if (i === ch.length) {
        return true;
      }
      this.advance(1);
    }
    this.goToEnd();
    return false;
  }

  public advanceToEndOfLine(): boolean {
    return this.advanceIfRegExp(/^[ \t\r]*\n/).length > 0;
  }

  public skipBlankLines(): boolean {
    let n = 0;
    if (this.advanceIfRegExp(/^[\t\f\r ]*\n/)) {
      n++;
    }
    return n > 0;
  }

  public skipWhitespace(includeLineBreaks = true): boolean {
    const n = this.advanceWhileChar((ch) => {
      return (
        ch === tt._WSP ||
        ch === tt._TAB ||
        (includeLineBreaks &&
          (ch === tt._CAR || ch === tt._NWL || ch === tt._LFD))
      );
    });
    return n > 0;
  }

  public advanceWhileChar(condition: (ch: number) => boolean): number {
    const posNow = this.position;
    while (
      this.position < this.len &&
      condition(this.source.charCodeAt(this.position))
    ) {
      this.position++;
    }
    return this.position - posNow;
  }
}
