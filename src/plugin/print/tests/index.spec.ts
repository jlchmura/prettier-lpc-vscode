import * as prettierPlugin from "../..";
import * as prettier from "prettier";
import { LPCParser, ParseLPC } from "../../../parser/lpcParser";

describe("prettier-lpc plugin", () => {
  const format = (input: string, options?: prettier.Options) => {
    const formatted = prettier.format(input, {
      parser: prettierPlugin.AST_PARSER_NAME,
      plugins: [prettierPlugin],
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      ...options,
    });

    // always validating that the result of formatting is backward compatible with JSONata
    expect(() => ParseLPC(formatted)).not.toThrow();
    return formatted;
  };

  test("formats short functions", () => {
    let formatted = format(`string set_s(string s){return foo=s;}`);
    expect(formatted).toMatchInlineSnapshot(
      `"string set_s(string s) { return foo = s; }"`
    );

    formatted = format(`query_s ( ) {return s;}`);
    expect(formatted).toMatchInlineSnapshot(`"query_s() { return s; }"`);

    formatted = format(`test() { int i=0; return 1; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() {
        int i = 0;
        return 1;
      }"
    `);
  });

  test("format array typecasts", () => {
    let formatted = format(`string *dirs = (string *) env->query_dest_dir();`);
    expect(formatted).toMatchInlineSnapshot(
      `"string *dirs = (string*)env->query_dest_dir();"`
    );

    formatted = format(
      `string * dirs = obj->fn( (string *) env->query_dest_dir() );`
    );
    expect(formatted).toMatchInlineSnapshot(
      `"string *dirs = obj->fn((string*)env->query_dest_dir());"`
    );
  });

  test("format args passed byref", () => {
    let formatted = format(`test(string &d) { d[0] += 32; }`);
    expect(formatted).toMatchInlineSnapshot(
      `"test(string &d) { d[0] += 32; }"`
    );
  });

  test("format ternary expressions", () => {
    // without paren
    let formatted = format(
      `printf("Foo is %s\\n", test=="bar" ? "bar" : "notbar");`
    );
    expect(formatted).toMatchInlineSnapshot(
      `"printf("Foo is %s\\n", test == "bar" ? "bar" : "notbar");"`
    );

    // with paren
    formatted = format(
      `printf("Foo is %s\\n", (test=="bar") ? "bar" : "notbar");`
    );
    expect(formatted).toMatchInlineSnapshot(
      `"printf("Foo is %s\\n", (test == "bar") ? "bar" : "notbar");"`
    );

    formatted = format(
      `test ()
{
  if (!a && !ob->b())
    return "foo";
  else
    return sprintf("bar %s",
          ob->test() && ob2->test() 
          ? "bar"
        : ob->bar() ? "baz" : "baz2");
}
`
    );
    expect(formatted).toMatchInlineSnapshot(`
    "test() {
      if (!a && !ob->b()) return "foo";
      else
        return
          sprintf(
            "bar %s",
            ob->test() && ob2->test() ? "bar" : ob->bar() ? "baz" : "baz2"
          );
    }"
    `);
  });

  test("format binary expressions", () => {
    let formatted = format(
      `test() { if ( a != 0 && ( b == 0 || c >= MIN )) {return 1;}}`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "test() {
        if (a != 0 && (b == 0 || c >= MIN)) {
          return 1;
        }
      }"
    `);
  });

  test("format logical expression", () => {
    let formatted = format(`test(str) {return str == "NO" || str == "TWO";}`);
    expect(formatted).toMatchInlineSnapshot(
      `"test(str) { return str == "NO" || str == "TWO"; }"`
    );

    formatted = format(
      `test() { if (str == "a" && found2 & !taken) { write("You find nothing."); return 1; } }`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "test() {
        if (str == "a" && found2 & !taken) {
          write("You find nothing.");
          return 1;
        }
      }"
    `);
  });

  test("format labmdas", () => {
    let formatted = format(`test() { 
      list = filter_array(info(), lambda(({ 'test }), ({ #'!=, ({ #'[, 'isValid, NAME }), \"NONAME\" }) )); 
    }`);
    expect(formatted).toMatchInlineSnapshot(`
    "test() {
      list =
        filter_array(
          info(),
          lambda(({'test}), ({#'!=, ({#'[, 'isValid, NAME}), "NONAME"}))
        );
    }"
    `);
  });

  test("format variable declarations", () => {
    let formatted = format(`string 
      *arr,		/* OPTIONAL: Array of stuff */
      code;			/* test comment */
    `);

    expect(formatted).toMatchInlineSnapshot(`
    "string *arr, /* OPTIONAL: Array of stuff */
           code; /* test comment */"
    `);
  });

  test("format struct definitions", () => {
    let formatted = format(`// this struct should be on a single line
    struct coords { int x; int y; };`);

    expect(formatted).toMatchInlineSnapshot(`
    "// this struct should be on a single line
    struct coords { int x; int y; };"
    `);
  });
});
