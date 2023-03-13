import * as vscode from "vscode";
import path from "node:path";
import plugin, { LPCOptions } from "./plugin";
import prettier, { Config, Options, resolveConfig } from "prettier";
import { Position, Range, TextDocument, TextEdit, window } from "vscode";

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

  return {
    ...formattingOptions,
    ...prettierConfig,
    filepath: cmd(document.fileName),
    parser: "lpc",
    plugins: [plugin],
  };
};

export async function activate(context: vscode.ExtensionContext) {
  const formatProvider = () => ({
    async provideDocumentFormattingEdits(
      document: vscode.TextDocument,
      formattingOptions: vscode.FormattingOptions
    ): Promise<vscode.TextEdit[]> {
      const extensionSettings =
        vscode.workspace.getConfiguration("Prettier-lpc");
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
      vscode.window.showErrorMessage("Unable to format LPC:\n" + e);
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
