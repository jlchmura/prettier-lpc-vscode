#!/usr/bin/env node

import fs from "fs";
import { format, Options } from "prettier";
import plugin, { LPCOptions } from "../plugin";

const code = fs.existsSync(process.argv[2])
  ? fs.readFileSync(process.argv[2], "utf-8")
  : process.argv.slice(2).join(" ").replace(/\\n/g, "\n");

const options: Partial<LPCOptions> = {
  parser: "lpc",
  plugins: [plugin]
};

const formatted = format(code, options);
console.log(formatted);
