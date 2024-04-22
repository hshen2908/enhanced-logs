import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { LogConfig } from "../../utils/logConfig";

export class LogProblemsTreeDataProvider implements vscode.TreeDataProvider<ProblemItem> {
    static readonly viewId: string = "enhanced-logs-panel-problems";
    public _onDidChangeTreeData: vscode.EventEmitter<ProblemItem | undefined | null | void> = new vscode.EventEmitter();
    onDidChangeTreeData?: vscode.Event<void | ProblemItem | ProblemItem[] | null | undefined> | undefined = this._onDidChangeTreeData.event;
    
    constructor() {
        vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor | undefined) => {
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: ProblemItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ProblemItem | undefined): vscode.ProviderResult<ProblemItem[]> {
        const rootWorkspacesDirectory = LogConfig.getRootWorkspacesDirectory();
        if (!rootWorkspacesDirectory) {
            vscode.window.showInformationMessage('Enhanced Logs: Root Workspaces Directory not configured');
            return Promise.resolve([]);
        }
        if (vscode.window.activeTextEditor?.document) {
            return this.getLogFileProblems(vscode.window.activeTextEditor?.document.uri)
        } else {
            return Promise.resolve([]);
        }
    }

    getParent?(element: ProblemItem): vscode.ProviderResult<ProblemItem> {
        throw new Error("Method not implemented.");
    }

    resolveTreeItem?(item: vscode.TreeItem, element: ProblemItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }

    async getLogFileProblems(resourceUri: vscode.Uri): Promise<ProblemItem[]> {
        if (!resourceUri.fsPath.endsWith(".log")) {
            return [];
        }
    
        const document: vscode.TextDocument = await vscode.workspace.openTextDocument(resourceUri);    
        const problemRegExp: RegExp = new RegExp(LogConfig.getErrorRegExp(), "i");
        const problemItems: ProblemItem[] = [];
        for (let i = 0; i < document.lineCount; i++) {
            const lineText: string = document.lineAt(i).text;
            if (problemRegExp.test(lineText)) {
                const uri: vscode.Uri = vscode.Uri.file(resourceUri.fsPath).with({ fragment: `L${i+1},${0}`})
                problemItems.push(new ProblemItem(`${lineText}`, uri, i, vscode.TreeItemCollapsibleState.None))
            }
        }
        return problemItems;
    }
}

class ProblemItem extends vscode.TreeItem {
    readonly lineNumber: number;

    constructor(label: string, resourceUri: vscode.Uri, lineNumber: number, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(resourceUri, collapsibleState);
        this.label = label;
        this.lineNumber = lineNumber;
        this.tooltip = resourceUri.fsPath;
        this.command = ProblemCommands.getOpenProblemItemCommand(this);
        this.iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"))
    }
}

export class ProblemCommands {
    static registerCommands(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.commands.registerCommand(
            `enhanced-logs.${ProblemCommands.openProblemItemCommand.name}`, 
            ProblemCommands.openProblemItemCommand));
    }

    static async openProblemItemCommand(problemItem: ProblemItem) {
        try {
            if (problemItem.resourceUri?.fsPath && !fs.lstatSync(problemItem.resourceUri.fsPath).isDirectory()) {
                await vscode.commands.executeCommand("vscode.open", problemItem.resourceUri);
                const decoration = vscode.window.createTextEditorDecorationType({
                    borderColor: "#ffffff",
                    border: "1px solid"
                });
                vscode.window.activeTextEditor?.setDecorations(decoration, [new vscode.Range(new vscode.Position(problemItem.lineNumber, 0), new vscode.Position(problemItem.lineNumber, 9999))]);
                setTimeout(() => {
                    vscode.window.activeTextEditor?.setDecorations(decoration, []);   
                }, 300)
            }
        } catch (error) {
            return;
        } 
    }
    
    static getOpenProblemItemCommand(problemItem: ProblemItem): ProblemCommand {
        return new ProblemCommand(
            `Open ${problemItem.resourceUri?.path}`, 
            `enhanced-logs.${ProblemCommands.openProblemItemCommand.name}`, 
            problemItem.resourceUri?.path ?? "", 
            [problemItem]);
    }
}

class ProblemCommand implements vscode.Command {
    title: string;
    command: string;
    tooltip?: string | undefined;
    arguments?: any[] | undefined;
    
    constructor(title: string, command: string, tooltip: string, args: any[]) {    
        this.title = title;
        this.command = command;
        this.tooltip = tooltip;
        this.arguments = args;
    }
}