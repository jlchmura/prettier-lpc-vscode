import * as prettier from "prettier";
import * as prettierPlugin from "../..";
import { ParseLPC, ParserError } from "../../../parser/lpcParser";
import {
  assign_exp_suffix_comment,
  fluffClassTypeCast,
  for_loop_various,
  ifWithExtraCurlyBrackets,
  if_condense_test,
  literal_consecutive_strings,
  mapping_with_ternary_value,
  spec_input_room,
  textFormatCallExpInArray,
  textFormatCallExpInStringBinaryExp,
  textFormatStringBlockWithDuplicateMarker,
  textFormattingDouble,
  textFormattingLiteralBlockWithSuffix,
  textFormattingSingle,
  textNestedParenBlocksWithLogicalExpr,
} from "./inputs";

describe("prettier-lpc plugin", () => {
  const format = (
    input: string,
    options?: Partial<prettierPlugin.LPCOptions>
  ) => {
    const opt = {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
    } as Partial<prettierPlugin.LPCOptions>;

    const formatted = prettier.format(input, {
      parser: prettierPlugin.AST_PARSER_NAME,
      plugins: [prettierPlugin],
      ...opt,
      ...options,
    });

    // always validating that the result of formatting is backward compatible with JSONata
    expect(() => ParseLPC(formatted)).not.toThrow();

    return formatted;
  };

  test("formats short functions", () => {
    let formatted = format(`string set_s(string s){return foo=s;}`);
    expect(formatted).toMatchInlineSnapshot(`
      "string set_s(string s) { return foo = s; }
      "
    `);

    formatted = format(`query_s ( ) {return s;}`);
    expect(formatted).toMatchInlineSnapshot(`
      "query_s() { return s; }
      "
    `);

    formatted = format(`test() { int i=0; return 1; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() {
        int i = 0;
        return 1;
      }
      "
    `);
  });

  test("format array typecasts", () => {
    let formatted = format(`string *dirs = (string *) env->query_dest_dir();`);
    expect(formatted).toMatchInlineSnapshot(`
      "string *dirs = (string*)env->query_dest_dir();
      "
    `);

    formatted = format(
      `string * dirs = obj->fn( (string *) env->query_dest_dir() );`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "string *dirs = obj->fn((string*)env->query_dest_dir());
      "
    `);
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

    // array w/ suffix comment
    formatted = format(`
    test() { 
      items = ({     ({"gates", "steel gates"}), "Strong metal gates.",  
      });  // sfx
    }    
    `);
    expect(formatted).toMatchSnapshot("array-with-sfx-comment");

    formatted = format(`
    test() { 
      items = ({     ({"gates", "steel gates"}), "Strong metal gates.",   // inner sfx
      });  // sfx
      // post 
    }    
    `);
    expect(formatted).toMatchSnapshot("array-with-multi-sfx-comments");

    formatted = format(`test() { 
      items = ({
#ifndef TEST
        1, 2,
        3
#endif
      });
    }`);
    expect(formatted).toMatchSnapshot("array-with-inline-directives");
  });

  describe("pair arrays", () => {
    test("format pair arrays based on var name", () => {
      let formatted = format(
        `test() { dest_dir = ({ "room1", "north", "room2", "south" }); }`
      );
      expect(formatted).toMatchSnapshot("array-pair-varname");
    });

    test("format pair arrays based on hint", () => {
      let formatted = format(
        `test() { 
          // @prettier-pair
          not_dest_dir = ({ "room1", "north", "room2", "south" }); }
          `
      );
      expect(formatted).toMatchSnapshot("array-pair-varname");
    });

    test("pairs with odd number of items shouldnt be in pair mode", () => {
      let formatted = format(
        `test() { dest_dir = ({ "room1", "north", "room2" }); }`
      );
      expect(formatted).toMatchInlineSnapshot(`
        "test() { dest_dir = ({"room1", "north", "room2"}); }
        "
      `);
    });
  });

  test("format call-exp inside arrays", () => {
    let formatted = format(textFormatCallExpInArray);
    expect(formatted).toMatchSnapshot("call-exp-in-array");
  });

  test("format args passed byref", () => {
    let formatted = format(`test(string &d) { d[0] += 32; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test(string &d) { d[0] += 32; }
      "
    `);
  });

  test("format parens", () => {
    // arith ops inside paren
    let formatted = format(
      `void test() { obj->set_weight(1 + random(avail_weight-1))     }`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "void test() { obj->set_weight(1 + random(avail_weight - 1)); }
      "
    `);

    formatted = format(textNestedParenBlocksWithLogicalExpr);
    expect(formatted).toMatchSnapshot("nested-parens-with-logical-exp");

    formatted = format(
      `test() { if((obj = present("armour", TP)) && obj->query_worn()) {} }`
    );
    expect(formatted).toMatchSnapshot("nested-parens-with-logical-exp");
  });

  test("format ternary expressions", () => {
    // without paren
    let formatted = format(
      `printf("Foo is %s\\n", test=="bar" ? "bar" : "notbar");`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "printf("Foo is %s\\n", test == "bar" ? "bar" : "notbar");
      "
    `);

    // with paren
    formatted = format(
      `printf("Foo is %s\\n", (test=="bar") ? "bar" : "notbar");`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "printf("Foo is %s\\n", (test == "bar") ? "bar" : "notbar");
      "
    `);

    // arith op inside ternary
    formatted = format(
      `private int round(float n) { return (int)(n < 0 ? n - 0.5 : n + 0.5); }`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "private int round(float n) { return (int)(n < 0 ? n - 0.5 : n + 0.5); }
      "
    `);

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
      }
      "
    `);

    formatted = format(mapping_with_ternary_value);
    expect(formatted).toMatchSnapshot("mapping_with_ternary_value");

    formatted = format(
      `test() { str = (str[0] == '/' ? "/" + implode(path, "/") : implode(path, "/")) }`
    );
    expect(formatted).toMatchSnapshot("ternary-after-binary");

    formatted = format(
      `test() { set_long("The " + race_arr[race] + " looks at " + (gender == 1 ? "him" : "her") + "."); }`
    );
    expect(formatted).toMatchSnapshot("ternary-with-lit-binary-op");

    // ternary expression used outside an assignment
    formatted = format(
      `int test() { gener == 1 ? firstName = males[random(sizeof(males))] : firstName = females[random(sizeof(females))]; return 1; }    `
    );
    expect(formatted).toMatchInlineSnapshot(`
      "int test() {
        gener == 1
          ? firstName = males[random(sizeof(males))]
          : firstName = females[random(sizeof(females))];
        return 1;
      }
      "
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
      }
      "
    `);

    formatted = format(textFormatCallExpInStringBinaryExp);
    expect(formatted).toMatchSnapshot("call-exp-inside-binary-string-exp");

    formatted = format(
      `int rounded = (((cnt + 5) / 10) * 10); // cheap rounding to nearest 10`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "int rounded = (((cnt + 5) / 10) * 10); // cheap rounding to nearest 10
      "
    `);
  });

  test("format logical expression", () => {
    let formatted = format(`test(str) {return str == "NO" || str == "TWO";}`);
    expect(formatted).toMatchInlineSnapshot(`
      "test(str) { return str == "NO" || str == "TWO"; }
      "
    `);

    formatted = format(
      `test() { if (str == "a" && found2 & !taken) { write("You find nothing."); return 1; } }`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "test() {
        if (str == "a" && found2 & !taken) {
          write("You find nothing.");
          return 1;
        }
      }
      "
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
      }
      "
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
    expect(formatted).toMatchInlineSnapshot(`
      "object *a = filter(all_inventory(room), (: $1->id("something") :));
      "
    `);

    // whitespace between ( and :
    formatted = format(`int *arr=filter(arr2,( :($1==1&&$1<10):));`);
    expect(formatted).toMatchInlineSnapshot(`
      "int *arr = filter(arr2, (: ($1 == 1 && $1 < 10) :));
      "
    `);

    formatted = format(`int *arr=filter(arr2,(:($1==1&&$1<10):));`);
    expect(formatted).toMatchInlineSnapshot(`
      "int *arr = filter(arr2, (: ($1 == 1 && $1 < 10) :));
      "
    `);
  });

  test("format variable declarations", () => {
    let formatted = format(`string 
      *arr,		/* OPTIONAL: Array of stuff */
      code;			/* test comment */
    `);

    expect(formatted).toMatchInlineSnapshot(`
      "string *arr, /* OPTIONAL: Array of stuff */
             code; /* test comment */
      "
    `);

    // multi-decl var
    formatted = format(`string *arr, code="", test=0, s;`);
    expect(formatted).toMatchInlineSnapshot(`
      "string *arr, code = "", test = 0, s;
      "
    `);

    // multilpe types of var decls
    formatted = format(`string s; mixed m; int i=0; mapping mp;`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s;
      mixed m;
      int i = 0;
      mapping mp;
      "
    `);

    // var decl inside function
    formatted = format(`test() { int i, j; string s=""; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() {
        int i, j;
        string s = "";
      }
      "
    `);
  });

  test("format struct definitions", () => {
    let formatted = format(`// this struct should be on a single line
    struct coords { int x; int y; };`);

    expect(formatted).toMatchInlineSnapshot(`
      "// this struct should be on a single line
      struct coords { int x; int y; };
      "
    `);
  });

  test("format macros", () => {
    let formatted = format(
      `#define WRAP(str)  trim("test"->word_wrap(str), 2)`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "#define WRAP(str) trim("test"->word_wrap(str), 2)
      "
    `);

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

    formatted = format(`#define TXT \\
      "String here with embedded \\n slash that is pretty long and should wrap to the next" \\
      + "line. Another line here. Don't combine this line because it is long too."
    `);
    expect(formatted).toMatchSnapshot("define-macro-multieline-withslash");
  });

  test("format arrow operators", () => {
    let formatted = format(`test() {
      "/obj/master"->
        query_player_exists();
    }`);

    expect(formatted).toMatchSnapshot("arrow-newline-after");

    // arrow after obj
    formatted = format(`string s = obj->test();`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = obj->test();
      "
    `);

    // arrow after call-exp
    formatted = format(`string s=fn()->test();`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = fn()->test();
      "
    `);

    // arrow after binary-exp in parens
    formatted = format(`string s=("obj"+"name")->test();`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = ("obj" + "name")->test();
      "
    `);

    // arrow inside ternary after arrow
    formatted = format(`string s = obj->test()?obj->test2() : "";`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = obj->test() ? obj->test2() : "";
      "
    `);

    // arrow with newlines
    formatted = format(`string s = obj
    ->
    test();`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = obj->test();
      "
    `);

    // arrow with suffix comment
    formatted = format(`string s = obj->fn(); // comment`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = obj->fn(); // comment
      "
    `);
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

    formatted = format(`test() {foreach (x, y : a){z = b[x];        } }`);
    expect(formatted).toMatchSnapshot("foreach-multi-var");

    formatted = format(`test() {foreach (x, y in a){z = b[x];        } }`);
    expect(formatted).toMatchSnapshot("foreach-multi-var-keep-in");
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

    // functions with multiple parameters
    formatted = format(`test(int a, int b) { return a+b; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test(int a, int b) { return a + b; }
      "
    `);

    // multiple params, declaration with multi variables
    formatted = format(
      `int flag=1, noflag=0; int flag1,flag2,flag3; test(string type, int b) { int foo,bar=1; return type; }`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "int flag = 1, noflag = 0;
      int flag1, flag2, flag3;
      test(string type, int b) {
        int foo, bar = 1;
        return type;
      }
      "
    `);
  });

  test("format variables that look like types", () => {
    let formatted = format(
      `void somefunc() { string status; status = sprintf("Stutus number: %d\n", status); }`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "void somefunc() {
        string status;
        status = sprintf("Stutus number: %d
      ", status);
      }
      "
    `);
  });

  test("format assignment expressions", () => {
    let formatted = format(assign_exp_suffix_comment);
    expect(formatted).toMatchSnapshot("assign_exp_suffix_comment");

    formatted = format(`int i=0; test() { indices = ({i, index++}); }`);
    expect(formatted).toMatchSnapshot("assignment_inside_array");
  });

  describe("If statements", () => {
    test("formats if statements", () => {
      let formatted = format(if_condense_test);
      expect(formatted).toMatchSnapshot("if_condense_test");
    });

    test("Ifs with extra curly brackets", () => {
      let formatted = format(ifWithExtraCurlyBrackets);
      expect(formatted).toMatchSnapshot("ifWithExtraCurlyBrackets");
    });

    test("Ifs with invalid commas", () => {
      // this should throw an error because of the comma after present()
      expect(() =>
        format(
          `void test() { if(present("string"), this_object()) { return 1; } }`
        )
      ).toThrow(ParserError);
    });
  });

  test("formats for loops", () => {
    let formatted = format(
      `test() { for (i = 0, j = sizeof(keys); i < j; i++, j--) { string key = keys[i];     }}`
    );
    expect(formatted).toMatchSnapshot("for-loop_multi_expression");

    formatted = for_loop_various;
    expect(formatted).toMatchSnapshot("for_loop_various");

    formatted = format(`for (int i=0; i < 10; ++i) { }`);
    expect(formatted).toMatchInlineSnapshot(`
      "for (int i = 0; i < 10; ++i) {  }
      "
    `);

    formatted = format(`for (int i=0; i < 10; i++) { }`);
    expect(formatted).toMatchInlineSnapshot(`
      "for (int i = 0; i < 10; i++) {  }
      "
    `);

    formatted = format(`for (int i=10; i > 0; --i) { }`);
    expect(formatted).toMatchInlineSnapshot(`
      "for (int i = 10; i > 0; --i) {  }
      "
    `);

    formatted = format(`for (int i=10; i > 0; i--) { }`);
    expect(formatted).toMatchInlineSnapshot(`
      "for (int i = 10; i > 0; i--) {  }
      "
    `);

    formatted = format(`void test() { while(true) {if (1==1)continue ;}}`);
    expect(formatted).toMatchSnapshot("loop-continue-shouldhave-semi");

    formatted = format(`void test() { while(true) {if (1==1)break ;}}`);
    expect(formatted).toMatchSnapshot("loop-break-shouldhave-semi");

    formatted = format(`
move_wanderer()
{
   while(remove_call_out("move_wanderer") >= 0);
        call_out("move_wanderer", 100);
}
`);
    expect(formatted).toMatchSnapshot("loop-while-no-body");
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

  test("format literal characters", () => {
    let formatted = format(`test() { int i='j'; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() { int i = 'j'; }
      "
    `);

    formatted = format(`test() { fn('a'); }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() { fn('a'); }
      "
    `);

    formatted = format(`test() { fn('\\n'); }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() { fn('\\n'); }
      "
    `);

    formatted = format(`test() { int i='\\n'; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() { int i = '\\n'; }
      "
    `);

    formatted = format(`test() { int i='\\n'+'a'; }`);
    expect(formatted).toMatchInlineSnapshot(`
      "test() { int i = '\\n' + 'a'; }
      "
    `);
  });

  test("format indexors", () => {
    let formatted = format(`string s = a[0..2]`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = a[0..2];
      "
    `);

    formatted = format(`string s = a[ 0..]`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = a[0..];
      "
    `);

    formatted = format(`string s = a[0..<2]`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = a[0..<2];
      "
    `);

    formatted = format(`string s = a[<1..<2]`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = a[<1..<2];
      "
    `);

    formatted = format(`string s = a[<1]`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = a[<1];
      "
    `);

    formatted = format(`string s = a[ <1.. <2]`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = a[<1..<2];
      "
    `);

    // deep mapping indexors
    formatted = format(
      `void test() { printf("%O\n", animals["bird"]["age"]["born"]["date"]["time"]);  }`
    );
    expect(formatted).toMatchInlineSnapshot(`
      "void test() {
        printf("%O
      ", animals["bird"]["age"]["born"]["date"]["time"]);
      }
      "
    `);

    formatted = format(
      `void test() { printf("%O\n", animals["bird"].name);  }`
    );
    expect(formatted).toMatchSnapshot("indexor-member-exp");
  });

  test("handle string literals with escaped quotes", () => {
    let formatted = format(`string s = "testing\\" 123";`);
    expect(formatted).toMatchInlineSnapshot(`
      "string s = "testing\\" 123";
      "
    `);

    formatted = format(`string s = "testing\\" 123\\\\";`);
    expect(formatted).toMatchSnapshot("literal_strings_multiple_escapes");
  });

  test("function declarations", () => {
    // fluffos version with no variable name
    let formatted = format(`string evaluate_path(string);`);
    expect(formatted).toMatchInlineSnapshot(`
      "string evaluate_path(string);
      "
    `);

    // LD version
    formatted = format(`string evaluate_path(string s);`);
    expect(formatted).toMatchInlineSnapshot(`
      "string evaluate_path(string s);
      "
    `);
  });

  describe("inherit statements", () => {
    test("print inherit statements", () => {
      let formatted = format(`inherit "/path/file"; test() { write("test"); }`);
      expect(formatted).toMatchSnapshot("inherit-basic");

      formatted = format(
        `inherit __DIR__ "file" ".c"; test() { write("test"); }`
      );
      expect(formatted).toMatchSnapshot(`inherit-implied-concat`);

      formatted = format(
        `inherit (__DIR__ + "file"); test() { write("test"); }`
      );
      expect(formatted).toMatchSnapshot("inherit-parenblock");
    });

    test("parse inherit statements with just a define", () => {
      let formatted = format(`
      #define D "test"
      inherit DEFINE;
      test() {}
      `);

      expect(formatted).toMatchSnapshot("inherit-define");
    });
  });

  describe("function calls", () => {
    test("handles multiple arguments", () => {
      let formatted = format(`test() { fn("a","b"); }`);
      expect(formatted).toMatchInlineSnapshot(`
        "test() { fn("a", "b"); }
        "
      `);

      formatted = format(`test() { fn("a", -1); }`);
      expect(formatted).toMatchInlineSnapshot(`
        "test() { fn("a", -1); }
        "
      `);
    });
  });

  describe("root", () => {
    test("should always end with newline", () => {
      let formatted = format(`test() { fn("a"); }`);
      expect(formatted).toMatchInlineSnapshot(`
        "test() { fn("a"); }
        "
      `);
    });
  });

  describe("FluffOS", () => {

    describe("class access", ()=>{
      test("class typecast", ()=>{
        let formatted = format(fluffClassTypeCast);
        expect(formatted).toMatchSnapshot("fluff-class-typecast");
      });
    });

    describe("String Literal Blocks", () => {
      test("fluffos text formatting shortcuts (@)", () => {
        let formatted = format(textFormattingSingle);
        expect(formatted).toMatchSnapshot("textFormattingSingle");

        formatted = format(textFormattingDouble);
        expect(formatted).toMatchSnapshot("textFormattingDouble");
      });

      test("Text formatting shorcuts with suffix comment", () => {
        let formatted = format(textFormattingLiteralBlockWithSuffix);
        expect(formatted).toMatchSnapshot(
          "textFormattingLiteralBlockWithSuffix"
        );
      });

      test("Text formatting shortcuts with duplicate marker", () => {
        let formatted = format(textFormatStringBlockWithDuplicateMarker);
        expect(formatted).toMatchSnapshot(
          "textFormatStringBlockWithDuplicateMarker"
        );
      });
    });

    describe("Default Arguments", () => {
      test("Format functions with default closure arguments", () => {
        let formatted = format(`test(int j, string s: (: 0 :)) { int i = j; }`);
        expect(formatted).toMatchInlineSnapshot(`
          "test(int j, string s: (: 0 :)) { int i = j; }
          "
        `);
      });
    });

    test("handles the spread operator (FluffOS)", () => {
      let formatted = format(
        `mixed sum(mixed *numbers...) { mixed number, result = 0; fn(1, numbers...); return result; }`
      );
      expect(formatted).toMatchSnapshot("spread-op-function-and-callexp");

      formatted = format(
        `debugf(sprintf("Alarm %O: %O called at %s", alarm.args..., ctime())) ;`
      );
      expect(formatted).toMatchSnapshot("spread-on-member-exp");
    });

    test("Closures", () => {
      // fluffos $() syntax
      let formatted = format(`int *arr=filter(arr2,(:$(var):));`);
      expect(formatted).toMatchInlineSnapshot(`
        "int *arr = filter(arr2, (: $(var) :));
        "
      `);
    });

    // end FluffOS
  });
});
