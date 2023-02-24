import { TokenType } from "../lpcLanguageTypes";
import { Scanner } from "../lpcScanner";

describe("lpcScanner (LPC Lexer)", ()=>{
  const lexToArray = (input: string) => {
    const s = new Scanner(input);
    let t: TokenType;
    const arr: TokenType[] = [];
    while ((t=s.scan()) && t != TokenType.EOS) {
      arr.push(t);
    }
    return arr;
  };

  test("Tokenize various parens",()=>{
    const input = `test(int i, int j) { mixed *arr=fn(({1,2,({3,4})}),([5,6]),(7+8),("foo"+"bar"), (: obj->fn($1) :))}`    
    const tokens = lexToArray(input);
    expect(tokens).toMatchSnapshot('fn-with-various-parens');
  })
});
