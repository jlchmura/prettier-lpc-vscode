#!/usr/bin/env node

import fs from "fs";
import { format, Options } from "prettier";
import { ParseLPC } from "../parser/lpcParser";
import plugin, { LPCOptions } from "../plugin";
import { mapping_with_ternary_value } from "../plugin/print/tests/inputs";

const code = fs.existsSync(process.argv[2])
  ? fs.readFileSync(process.argv[2], "utf-8")
  : process.argv.slice(2).join(" ").replace(/\\n/g, "\n");

const options: Partial<LPCOptions> = {
  parser: "lpc",
  plugins: [plugin],
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
};

const formatted = format(code, options);
//const ast = ParseLPC(formatted);
console.log(formatted);
