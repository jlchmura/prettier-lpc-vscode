import * as prettierPlugin from "../..";
import * as prettier from "prettier";
import { LPCParser, ParseLPC } from "../../../parser/lpcParser";
import {
  assign_exp_suffix_comment,
  for_loop_various,
  if_condense_test,
  literal_consecutive_strings,
  mapping_with_ternary_value,
  spec_input_room,
} from "./inputs";

describe("prettier-lpc plugin", () => {
  const format = (
    input: string,
    options?: Partial<prettierPlugin.LPCOptions>
  ) => {
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

  test("format arrays", () => {
    let formatted = format(
      `test() { items = ({     ({"gates", "steel gates"}), "Strong metal gates.", }); }`
    );
    expect(formatted).toMatchSnapshot("array-condensed");

    formatted = format(
      `test() { items = ({     
        ({"gates", "steel gates"}), "Strong metal gates.", }); }`
    );
    expect(formatted).toMatchSnapshot("array-inner-condensed");

    formatted = format(
      `test() { items = ({     
        ({ 
          "gates", "steel gates"}), "Strong metal gates.", }); }`
    );
    expect(formatted).toMatchSnapshot("array-none-condensed");
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

    // arith op inside ternary
    formatted = format(
      `private int round(float n) { return (int)(n < 0 ? n - 0.5 : n + 0.5); }`
    );
    expect(formatted).toMatchInlineSnapshot(
      `"private int round(float n) { return (int)(n < 0 ? n - 0.5 : n + 0.5); }"`
    );

    formatted = format(
      `private int round(float n) { int i=(int)(n < 0 ? n - 0.5 : n + 0.5); return i; }`
    );
    expect(formatted).toMatchSnapshot("ternary_arith_op_inside");

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

    formatted = format(mapping_with_ternary_value);
    expect(formatted).toMatchSnapshot("mapping_with_ternary_value");

    formatted = format(
      `test() { str = (str[0] == '/' ? "/" + implode(path, "/") : implode(path, "/")) }`
    );
    expect(formatted).toMatchSnapshot("ternary-after-binary");
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

  test("format closures", () => {
    let formatted = format(
      `test() { object *hash = ({}); hash = sort_array(hash, #'>); hash = filter(hash, #'this_player); }`
    );
    expect(formatted).toMatchSnapshot("closure-greaterthan-this_player");

    formatted = format(
      `object *a = filter(all_inventory(room), (: $1->id("something") :));`
    );
    expect(formatted).toMatchInlineSnapshot(
      `"object *a = filter(all_inventory(room), (: $1->id("something") :));"`
    );

    formatted = format(`int *arr=filter(arr2,(:($1==1&&$1<10):));`);
    expect(formatted).toMatchInlineSnapshot(
      `"int *arr = filter(arr2, (: ($1 == 1 && $1 < 10) :));"`
    );
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

    // multi-decl var
    formatted = format(`string *arr, code="", test=0, s;`);
    expect(formatted).toMatchInlineSnapshot(
      `"string *arr, code = "", test = 0, s;"`
    );

    // multilpe types of var decls
    formatted = format(`string s; mixed m; int i=0; mapping mp;`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s;
      mixed m;
      int i = 0;
      mapping mp;"
    `);

    // var decl inside function
    formatted = format(`test() { int i, j; string s=""; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() {
        int i, j;
        string s = "";
      }"
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

  test("format macros", () => {
    let formatted = format(
      `#define WRAP(str)  trim("test"->word_wrap(str), 2)`
    );
    expect(formatted).toMatchInlineSnapshot(
      `"#define WRAP(str) trim("test"->word_wrap(str), 2)"`
    );

    formatted = format(
      `#define WRAP(str)  trim("really really really really long string"->word_wrap(str), 2)`,
      { printWidth: 20 }
    );
    expect(formatted).toMatchSnapshot("define-macro-with-wrap");

    formatted = format(`#define W2(s) \
      trim("local/really really really long string really really really really long/util")-> \
      wrap(({ a, s }))
    `);
    expect(formatted).toMatchSnapshot("define-macro-multiline");
  });

  test("format arrow operators", () => {
    let formatted = format(`test() {
      "/obj/master"->
        query_player_exists();
    }`);

    expect(formatted).toMatchSnapshot("arrow-newline-after");

    // arrow after obj
    formatted = format(`string s = obj->test();`);
    expect(formatted).toMatchInlineSnapshot(`"string s = obj->test();"`);

    // arrow after call-exp
    formatted = format(`string s=fn()->test();`);
    expect(formatted).toMatchInlineSnapshot(`"string s = fn()->test();"`);

    // arrow after binary-exp in parens
    formatted = format(`string s=("obj"+"name")->test();`);
    expect(formatted).toMatchInlineSnapshot(
      `"string s = ("obj" + "name")->test();"`
    );

    // arrow inside ternary after arrow
    formatted = format(`string s = obj->test()?obj->test2() : "";`);
    expect(formatted).toMatchInlineSnapshot(
      `"string s = obj->test() ? obj->test2() : "";"`
    );

    // arrow with newlines
    formatted = format(`string s = obj
    ->
    test();`);
    expect(formatted).toMatchInlineSnapshot(`"string s = obj->test();"`);

    // arrow with suffix comment
    formatted = format(`string s = obj->fn(); // comment`);
    expect(formatted).toMatchInlineSnapshot(
      `"string s = obj->fn(); // comment"`
    );
  });

  test("format foreach loops", () => {
    let formatted = format(
      `test() { string exitKey; foreach(exitKey : all_exits) { write(exitKey); } }`
    );
    expect(formatted).toMatchSnapshot("foreach-collapsed");

    formatted = format(
      `test() { string exitKey; foreach(exitKey : all_exits) { write(exitKey); i++; } }`
    );
    expect(formatted).toMatchSnapshot(`foreach-multiline`);

    formatted = format(`test() { foreach(i : 1 .. 6) printf("%d\n", i); }`);
    expect(formatted).toMatchSnapshot("foreach-range-collapsed");

    formatted = format(
      `test() { foreach(i : 1 .. 6) { printf("%d\n", i); j++; } }`
    );
    expect(formatted).toMatchSnapshot("foreach-range-multiline");
  });

  test("general formatting", () => {
    let formatted = format(spec_input_room);
    expect(formatted).toMatchSnapshot("spec_input_room");
  });

  test("format functions", () => {
    let formatted = format(
      `int level=0; public int query_level(); public void set_level(int level); public int query_next_level(); public int query_level() { return level ; }`
    );
    expect(formatted).toMatchSnapshot("function-stubs");

    formatted = format(`int gmcp_send_map();
    int gmcp_send_map_config(); 
    
    /**
     * Should not move the coment up after the semi
     */`);
    expect(formatted).toMatchSnapshot("function-stub-with-newline-comments");
  });

  test("format assignment expressions", () => {
    let formatted = format(assign_exp_suffix_comment);
    expect(formatted).toMatchSnapshot("assign_exp_suffix_comment");
  });

  test("formats if statements", () => {
    let formatted = format(if_condense_test);
    expect(formatted).toMatchSnapshot("if_condense_test");
  });

  test("formats for loops", () => {
    let formatted = format(
      `test() { for (i = 0, j = sizeof(keys); i < j; i++, j--) { string key = keys[i];     }}`
    );
    expect(formatted).toMatchSnapshot("for-loop_multi_expression");

    formatted = for_loop_various;
    expect(formatted).toMatchSnapshot("for_loop_various");
  });

  test("formatter should handle missing semi's", () => {
    // comma instead of semi
    let formatted = format(
      `test() { short = "short name", long = "long" + "desc"; }`
    );
    expect(formatted).toMatchSnapshot("missing_semi_comma_instead");
  });

  test("format literal strings", () => {
    // consecutive strings with no +
    let formatted = format(literal_consecutive_strings);
    expect(formatted).toMatchSnapshot("literal_consecutive_strings");
  });
});
