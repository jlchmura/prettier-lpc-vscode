import * as vscode from 'vscode';
import plugin, { LPCOptions } from './plugin';
import { format, Options } from "prettier";

const getConfigs = (
  extensionSettings: vscode.WorkspaceConfiguration,
  formattingOptions: vscode.FormattingOptions
): Partial<LPCOptions> => {
  return {
    condenseSingleExpressionParams: extensionSettings.get<boolean>('condenseSingleExpressionParams'),
    tabWidth: extensionSettings.get<number>('tabWidth'),
    parser: "lpc",
    plugins: [plugin]
  };
};

export function activate(context: vscode.ExtensionContext) {
  const formatProvider = () => ({
    provideDocumentFormattingEdits(
      document: vscode.TextDocument,
      formattingOptions: vscode.FormattingOptions
    ): vscode.TextEdit[] {
      const extensionSettings = vscode.workspace.getConfiguration('Prettier-lpc');
      const formatConfigs = getConfigs(extensionSettings, formattingOptions);

      // extract all lines from document
      const lines = [...new Array(document.lineCount)].map((_, i) => document.lineAt(i).text);
      let text;
      try {
        text = format(lines.join('\n'), formatConfigs);
      } catch (e) {
        vscode.window.showErrorMessage('Unable to format LPC:\n' + e);
        return [];
      }

      // replace document with formatted text
      return [
        vscode.TextEdit.replace(
          new vscode.Range(
            document.positionAt(0),
            document.lineAt(document.lineCount - 1).range.end
          ),
          text + (extensionSettings.get('trailingNewline') ? '\n' : '')
        ),
      ];
    },
  });

  const languages = ["lpc"];

  // add Prettier-lpc as a format provider for each language
  languages.forEach(lang =>
    context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider(
        lang,
        formatProvider()
      )
    )
  );

  const formatSelectionCommand = vscode.commands.registerCommand(
    'prettier-lpc-vscode.format-document',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const documentLanguage = editor.document.languageId ?? 'lpc';
      const formatterLanguage = 'lpc';

      const extensionSettings = vscode.workspace.getConfiguration('Prettier-lpc');

      const formatConfigs = getConfigs(
        extensionSettings,
        {
          // According to types, these editor.options properties can also be strings or undefined,
          // but according to docs, the string|undefined value is only applicable when setting,
          // so it should be safe to cast them.
          tabSize: editor.options.tabSize as number,
          insertSpaces: editor.options.insertSpaces as boolean,          
        }        
      );

      try {        
        // format and replace each selection
        const doc = editor.document;
        editor.edit(editBuilder => {
          const txt = editor.document.getText();
          const fmted = format(txt, formatConfigs);          
          editBuilder.replace(new vscode.Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end), fmted);
        });
      } catch (e) {
        vscode.window.showErrorMessage('Unable to format LPC:\n' + e);
      }
    }
  );

  context.subscriptions.push(formatSelectionCommand);
}

export function deactivate() {}
