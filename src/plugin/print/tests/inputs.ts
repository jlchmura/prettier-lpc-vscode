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