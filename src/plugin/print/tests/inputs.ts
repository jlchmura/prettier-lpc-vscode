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