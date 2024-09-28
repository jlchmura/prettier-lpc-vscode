export const spec_input_room = `#include "../globals.h"
inherit "/room/room";

object monster;

reset(arg)
{
  if (!arg)
    {
    set_light(1);
    set_realm("something");
    short_desc = "Room";
    long_desc =
"This is a long\n"+
"Room description that goes\n"+
"on for several lines\n";
    items =
      ({
        ({"table", "small table", "wood table"}),
"A table made of wood",
          ({ "bench", "wood bench" }),
          "A bench made of wood"
         });
    
    dest_dir =
      ({
        BASE + "/northroom", "north",
      });
    }
    
  if (!present("monster"))
    {
    monster = clone_object("obj/monster");
    monster->set_name("monster");
    monster->set_alias(({"monster"}));    
    monster->set_hp(200);    
    move_object(monster, this_object());
    }
}
`;


export const mapping_with_ternary_value =
`/**
* send data
*/
public varargs int send_config(object player) {
 mixed *arr = ({}); // array of environment data objects
 
 mapping data = MASTER->query_data();
 if (!data) {
   write("WARN: Could not load");
 }
 foreach (string nm : data) {
   int id = data[nm, 0];
   mapping d = ([
       ID: id ? id : "0", // need string zero, not int 0
       NAME: nm,
       C: data[nm, 1]
   ]);

   arr += ({d});
 }

 // package
 mapping pkg = ([KEY: arr]);

 object p = player ? player : this_player();
 return p->send(PKG, pkg);
}`;

export const assign_exp_suffix_comment = 
`test() { 
  exits = room->exits();   
  if (exits == -1)
      arr = ([]); // erase all exits      
  else if (stringp(exits))
      arr -= ([ exits ]);   
}`;

export const if_condense_test = `test() {
  // this should be fairly condensed
  if (
    str !=
    "down" &&
    str !=
    "up" &&
    str !=
    "hole" &&
    str !=
    "hill" &&
    str !=
    "mountain"
  ) return 0;
  else if (str == "sky")
  {
    // send them
    move_player("sky");
    return 1;
  } else 
  return 0;
}`;


export const for_loop_various = `test() {
  for (int i=0,j=1;i<10;i++,j+=2) { fn(i,j); }
  for (int i=0,j=1;i<10;) { fn(i,j); }
  int i;
  for (i=0;i<10;i--) { fn(i); }
}`

export const literal_consecutive_strings = `test() {
  desc = "this is line one. it is the first line in the description\n"
    "this is line 2.\n"
    "this is line 3.";

  desc = "this is line one. it is the first line in the description\n" +
  "this is line 2.\n" +
  "this is line 3.";
}`;

export const textFormattingSingle = `void test() {
  set_desc(@TXT
This is
  a test
TXT
  );
}`


export const textFormattingDouble = `void test() {
  set_desc(@@TXT
This is
  a test
TXT
  );
}`

export const textFormattingLiteralBlockWithSuffix = `void test() {      
  set(@txt
Here is 
another block with
no suffix comment
txt
);

set("test", @txt
Here is 
another block with
a suffix comment
txt // '
);
}`

export const textFormatCallExpInArray = `#define SOME_DEFINE "some define"

void somefunc() {
    string *words ;
    words = ({ SOME_DEFINE, lower_case(SOME_DEFINE), upper_case(SOME_DEFINE) }) ;
}`;

export const textFormatCallExpInStringBinaryExp = `string test() {
  string name = query_name();
  return
      name +
      " was defeated by " +
      "/daemons/time_d"->query_time() +
      ".\n";
}`;

export const textNestedParenBlocksWithLogicalExpr = `test() {
  if( (ob=present("id", TP)) && (str == "to" || str == "from")) {
    write("hi");
  }
}`;

export const textFormatStringBlockWithDuplicateMarker = `test() {
  set("long", @text

  The soft black and white pelt has been expertly cured to preserve the 
texture and hairs of the panda's fur. Though the skin is quite beautiful,
the animal itself must have been even more majestic.

text
 );
}`;

export const ifWithExtraCurlyBrackets = `
void test() {
  if(str != "string")
  return 0;
  {
    if(str == "string")
    {
      return 1;
    }
  }
}
`;

export const fluffClassTypeCast = `
void test(string a)
{
   if (foo[a].stat == -1) 
      return;

   (class bar)foo[a]->stat = 0;
}
`;