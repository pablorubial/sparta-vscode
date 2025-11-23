import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log("SPARTA backend active!");

    //
    // -------------------------------------------------------------
    //  HOVER PROVIDER
    // -------------------------------------------------------------
    //
    const hoverProvider = vscode.languages.registerHoverProvider('sparta', {
        provideHover(document, position) {

            //
            // ----------- HOVER DE COMPUTE/FIX/DUMP -------------
            //
            const refRange = document.getWordRangeAtPosition(position, /(c|f|d)_(\d+)/);
            if (refRange) {

                const word = document.getText(refRange);
                const match = word.match(/(c|f|d)_(\d+)/);
                if (match) {
                    const refType = match[1];
                    const id = match[2];

                    let keyword = "";
                    if (refType === "c") keyword = "compute";
                    if (refType === "f") keyword = "fix";
                    if (refType === "d") keyword = "dump";

                    const fullText = document.getText();
                    const regex = new RegExp(`^\\s*${keyword}\\s+${id}\\b.*`, "m");
                    const found = fullText.match(regex);

                    if (found) {
                        return new vscode.Hover({
                            language: "sparta",
                            value: found[0].trim()
                        });
                    }

                    return new vscode.Hover(`⚠ No ${keyword} ${id} found in this file.`);
                }
            }

            //
            // ----------- HOVER DE VARIABLES (${var}, v_var) -------------
            //
            const varRange = document.getWordRangeAtPosition(position, /\$\{?([A-Za-z0-9_]+)\}?|v_[A-Za-z0-9_]+/);
            if (varRange) {

                const token = document.getText(varRange);
                let varName = "";

                if (token.startsWith("${")) varName = token.replace(/\$\{|\}/g, "");
                else if (token.startsWith("$")) varName = token.slice(1);
                else if (token.startsWith("v_")) varName = token.slice(2);

                if (varName.length > 0) {
                    const fullText = document.getText();
                    const regex = new RegExp(`^\\s*variable\\s+${varName}\\b.*`, "m");
                    const found = fullText.match(regex);

                    if (found) {
                        return new vscode.Hover({
                            language: "sparta",
                            value: found[0].trim()
                        });
                    } else {
                        return new vscode.Hover(`⚠ Variable '${varName}' not found.`);
                    }
                }
            }

            return;
        }
    });

    context.subscriptions.push(hoverProvider);



    //
    // -------------------------------------------------------------
    //  DEFINITION PROVIDER (F12)
    // -------------------------------------------------------------
    //
    const defProvider = vscode.languages.registerDefinitionProvider('sparta', {
        provideDefinition(document, position) {

            //
            // ----------- DEFINITION DE COMPUTE/FIX/DUMP -------------
            //
            const refRange = document.getWordRangeAtPosition(position, /(c|f|d)_(\d+)/);
            if (refRange) {

                const word = document.getText(refRange);
                const match = word.match(/(c|f|d)_(\d+)/);
                if (match) {

                    const refType = match[1];
                    const id = match[2];

                    let keyword = "";
                    if (refType === "c") keyword = "compute";
                    if (refType === "f") keyword = "fix";
                    if (refType === "d") keyword = "dump";

                    const fullText = document.getText();
                    const regex = new RegExp(`^\\s*${keyword}\\s+${id}\\b.*`, "m");
                    const found = regex.exec(fullText);

                    if (found) {

                        const lineStartIndex = found.index;
                        const commandMatch = found[0].match(/(compute|fix|dump)\s+\d+/);
                        if (!commandMatch) return;

                        const commandIndex = lineStartIndex + found[0].indexOf(commandMatch[0]);
                        const startPos = document.positionAt(commandIndex);

                        return new vscode.Location(document.uri, startPos);
                    }
                }
            }

            //
            // ----------- DEFINITION DE VARIABLES -------------
            //
            const varRange = document.getWordRangeAtPosition(position, /\$\{?([A-Za-z0-9_]+)\}?|v_[A-Za-z0-9_]+/);
            if (varRange) {

                const token = document.getText(varRange);
                let varName = "";

                if (token.startsWith("${")) varName = token.replace(/\$\{|\}/g, "");
                else if (token.startsWith("$")) varName = token.slice(1);
                else if (token.startsWith("v_")) varName = token.slice(2);

                if (varName.length > 0) {

                    const fullText = document.getText();
                    const regex = new RegExp(`^\\s*variable\\s+${varName}\\b.*`, "m");
                    const found = regex.exec(fullText);

                    if (found) {
                        const fileText = document.getText();

                        // Encontrar la línea real donde está la variable
                        const fullIndex = found.index;
                        const pos = document.positionAt(fullIndex);
                        const line = document.lineAt(pos.line);

                        // Encontrar la posición exacta de "variable <varName>" dentro de esa línea
                        const col = line.text.indexOf(`variable ${varName}`);

                        // Seguridad: si no hay coincidencia, saltar al inicio de línea
                        const finalPos = col >= 0 
                            ? new vscode.Position(pos.line, col)
                            : new vscode.Position(pos.line, 0);

                        return new vscode.Location(document.uri, finalPos);
                    }
                }
            }


            return;
        }
    });

    context.subscriptions.push(defProvider);
}

export function deactivate() {}

