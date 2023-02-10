export const tt = {
  _HSH: "#".charCodeAt(0),
  _BNG: "!".charCodeAt(0),
  _MIN: "-".charCodeAt(0),
  _LAN: "<".charCodeAt(0),
  _RAN: ">".charCodeAt(0),
  _BSL: "\\".charCodeAt(0),
  _FSL: "/".charCodeAt(0),
  _EQS: "=".charCodeAt(0),
  _DQO: '"'.charCodeAt(0),
  _SQO: "'".charCodeAt(0),
  _NWL: "\n".charCodeAt(0),
  _CAR: "\r".charCodeAt(0),
  _LFD: "\f".charCodeAt(0),
  _WSP: " ".charCodeAt(0),
  _TAB: "\t".charCodeAt(0),
  _SEM: ";".charCodeAt(0),
  _STR: "*".charCodeAt(0),
  _OPP: "(".charCodeAt(0),
  _CLP: ")".charCodeAt(0),
  _PLS: "+".charCodeAt(0),
  _MNS: "-".charCodeAt(0),
  _OBK: "{".charCodeAt(0),
  _CBK: "}".charCodeAt(0),
  _OSB: "[".charCodeAt(0),
  _CSB: "]".charCodeAt(0),
  _DOT: ".".charCodeAt(0),
  _COM: ",".charCodeAt(0),
  _COL: ":".charCodeAt(0),
  _PIP: "|".charCodeAt(0),
  _AMP: "&".charCodeAt(0),
  _QUE: "?".charCodeAt(0),
  _CALLOTHER: "->".split("").map((c) => c.charCodeAt(0)),
  _INHERIT: "inherit".split("").map((c) => c.charCodeAt(0)),
  _IF: "if".split("").map((c) => c.charCodeAt(0)),
  _ELSEIF: "else if".split("").map((c) => c.charCodeAt(0)),
  _ELSE: "else".split("").map((c) => c.charCodeAt(0)),
  _RETURN: "return".split("").map((c) => c.charCodeAt(0)),
  _FOR: "for".split("").map((c) => c.charCodeAt(0)),  
  _FOREACH: "foreach".split("").map((c) => c.charCodeAt(0)),
  _WHILE: "while".split("").map((c) => c.charCodeAt(0)),
  _BREAK: "break".split("").map((c) => c.charCodeAt(0)),
  _CONTINUE: "continue".split("").map((c) => c.charCodeAt(0)),
  _SWITCH: "switch".split("").map((c) => c.charCodeAt(0)),
  _CASE: "case".split("").map((c) => c.charCodeAt(0)),
  _DEFAULT: "default".split("").map((c) => c.charCodeAt(0)),
  _LAMBDA: "lambda".split("").map((c) => c.charCodeAt(0)),
};

export const binary_ops = [
  "==",
  "!=",
  "<<<",
  "<=",
  "<",
  ">=",
  ">",
  "<<",
  ">>"  
].map((o) => o.split("").map((c) => c.charCodeAt(0)));

export const logical_ops = [
  "||",
  "&&"
].map((o) => o.split("").map((c) => c.charCodeAt(0)));

export const assignment_ops = [
  "=",
  "+=",
  "-=",
  "&=",
  "|=",
  "^=",
  "<<=",
  ">>=",
  ">>>=",
  "*=",
  "%=",
  "/=",
  "&&=",
  "||=",
  "++",
].map((o) => o.split("").map((c) => c.charCodeAt(0)));

export const arrith_ops = ["+", "-", "*", "/", "!", "&", "|"].map((o) =>
  o.split("").map((c) => c.charCodeAt(0))
);

export const unary_ops_set = new Set(["!", "-"]);

export enum DeclType {
  Function = 1,
  Variable = 2,
  Inherit = 4,
}

export const modifiers: { [mod: string]: number } = {
  private: DeclType.Function | DeclType.Variable,
  protected: DeclType.Function,
  static: DeclType.Function | DeclType.Variable,
  public: DeclType.Function | DeclType.Variable,
  nomask: DeclType.Function,
  varargs: DeclType.Function,
  deprecated: DeclType.Function | DeclType.Variable,
  virtual: DeclType.Inherit,
};

export const types = [
  "int",
  "string",
  "status",
  "object",
  "array",
  "mapping",
  "closure",
  "symbol",
  "float",
  "mixed",
  "struct",
  "union",
  "null",
  "void",
];
export const typesSet = new Set(types);

export const modifiers_function = [
  "private",
  "protected",
  "static",
  "public",
  "nomask",
  "varargs",
  "deprecated",
];
export const modifiers_variable = [
  "private",
  "nosave",
  "static",
  "public",
  "deprecated",
];
export const modifiers_inherit = ["virtual"];

export const modifiers_set = new Set(modifiers_function.concat(modifiers_variable).concat(modifiers_inherit));

export const directives = [
  "include",
  "define",
  "if",
  "ifdef",
  "ifndef",
  "else",
  "elif",
  "endif",
  "undef",
  "line",
  "echo",
  "pragma",
];
export const directive_chars = directives.map((o) =>
  o.split("").map((c) => c.charCodeAt(0))
);

export const reserved_words = [
  "switch",
  "case",
  "break",
  "struct",
  "union",
  "enum",
  "default",
  "int",
  "char",
  "float",
  "double",
  "typdef",
  "unsigned",
  "register",
  "static",
  "global",
  "extern",
  "void",
  "inherit",
  //"va_dcl",
  "goto",
  "return",
  "if",
  "while",
  "for",
  "else",
  "do",
  //"sizeof",
]
export const reserved_words_set = new Set(reserved_words);