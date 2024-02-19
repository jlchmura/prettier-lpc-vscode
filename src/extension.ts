import path from "node:path";
import prettier, { Config, RequiredOptions, resolveConfig } from "prettier";
import * as vscode from "vscode";
import { Range, TextDocument, TextEdit, window } from "vscode";
import { ParserError } from "./parser/lpcParser";
import plugin, { LPCOptions } from "./plugin";

const getConfigs = async (
  extensionSettings: vscode.WorkspaceConfiguration,
  formattingOptions: vscode.FormattingOptions,
  document: vscode.TextDocument
): Promise<Partial<LPCOptions>> => {
  const prettierConfig =
    (await resolveConfig(document.fileName, {
      editorconfig: true,
      useCache: false,
    })) ?? {};

  const pairVar = extensionSettings.get<string[]>("pairVariables");
  return {
    ...formattingOptions,
    ...getIndentationConfig(extensionSettings, formattingOptions),
    ...prettierConfig,
    pairVariables: pairVar,
    filepath: cmd(document.fileName),
    parser: "lpc",
    plugins: [plugin],
  };
};

const getIndentationConfig = (
  extensionSettings: vscode.WorkspaceConfiguration,
  formattingOptions: vscode.FormattingOptions
): Partial<RequiredOptions> => {
  // override tab settings if ignoreTabSettings is true
  if (extensionSettings.get<boolean>("ignoreTabSettings")) {
    return {
      tabWidth: extensionSettings.get<number>("tabSizeOverride"),
      useTabs: !extensionSettings.get<boolean>("insertSpacesOverride"),
    };
  } else {
    return {
      tabWidth: formattingOptions.tabSize,
      useTabs: !formattingOptions.insertSpaces,
    };
  }
};

export async function activate(context: vscode.ExtensionContext) {
  const formatProvider = () => ({
    async provideDocumentFormattingEdits(
      document: vscode.TextDocument,
      formattingOptions: vscode.FormattingOptions
    ): Promise<vscode.TextEdit[]> {
      const extensionSettings =
        vscode.workspace.getConfiguration("Prettier-LPC");
      const formatConfigs = await getConfigs(
        extensionSettings,
        formattingOptions,
        document
      );

      return format(document, formatConfigs);
    },
  });

  const languages = ["lpc"];
  const fmt = formatProvider;

  // add Prettier-lpc as a format provider for each language
  languages.forEach((lang) =>
    context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider(lang, fmt())
    )
  );

  context.subscriptions.push(formatSelectionCommand);
}

const formatSelectionCommand = vscode.commands.registerCommand(
  "prettier-lpc-vscode.format-document",
  async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const extensionSettings = vscode.workspace.getConfiguration("Prettier-lpc");

    const formatConfigs = await getConfigs(
      extensionSettings,
      {
        // According to types, these editor.options properties can also be strings or undefined,
        // but according to docs, the string|undefined value is only applicable when setting,
        // so it should be safe to cast them.
        tabSize: editor.options.tabSize as number,
        insertSpaces: editor.options.insertSpaces as boolean,
      },
      editor.document
    );

    try {
      // format and replace each selection
      const doc = editor.document;

      editor.edit((editBuilder) => {
        const fmted = format(doc, formatConfigs);
        if (fmted.length > 0) {
          editBuilder.replace(fmted[0].range, fmted[0].newText);
        }
      });
    } catch (e) {
      if (e instanceof ParserError) {
        vscode.window.showErrorMessage("Unable to format LPC:\n" + e.message);

        if (!!e.loc) {
          let target = editor.document.positionAt(e.loc);
          target = editor.document.validatePosition(target);

          editor.revealRange(new vscode.Range(target, target));
          editor.selection = new vscode.Selection(target, target);
        }
        console.error(e);
      } else {
        vscode.window.showErrorMessage("Unable to format LPC:\n" + e);
      }
    }
  }
);

function format(document: TextDocument, config: Config) {
  // length of common prefix
  const next = tryFormat(document, config);
  const prev = document.getText();
  if (prev === next) {
    return [];
  }
  const end = Math.min(prev.length, next.length);
  var i = 0;
  var j = 0;
  for (var i = 0; i < end && compare(i, i); ++i);
  for (
    var j = 0;
    i + j < end && compare(prev.length - j - 1, next.length - j - 1);
    ++j
  );

  // return [
  //   TextEdit.replace(
  //     new Range(document.positionAt(0), document.positionAt(prev.length - 1)),
  //     next
  //   ),
  // ];

  return [
    TextEdit.replace(
      new Range(document.positionAt(i), document.positionAt(prev.length - j)),
      next.substring(i, next.length - j)
    ),
  ];
  function compare(i: number, j: number) {
    return prev.charCodeAt(i) === next.charCodeAt(j);
  }
}

function tryFormat(doc: TextDocument, config: prettier.Config) {
  try {
    return prettier.format(doc.getText(), config);
  } catch (e) {
    console.log(e);
    if ((e as any).loc) {
      const pos = doc.positionAt((e as any).loc);
      window.showTextDocument(doc, { selection: new Range(pos, pos) });
    }

    window.showErrorMessage((e as any).message);

    return doc.getText();
  }
}

export function deactivate() {}

function cmd(filepath: string | undefined, frompath = "") {
  return normPath(path.relative(frompath, normPath(filepath ?? ""))) || ".";
}

function normPath(filepath: string) {
  return filepath.replace(/^file:\/\/\//, "").replace(/\\\\?/g, "/");
}
