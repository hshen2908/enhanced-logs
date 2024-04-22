import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { LogConfig } from "../../utils/logConfig";

export class LogWorkspacesTreeDataProvider implements vscode.TreeDataProvider<WorkspaceItem> {
    static readonly viewId: string = "enhanced-logs-activitybar-workspaces";
    public _onDidChangeTreeData: vscode.EventEmitter<WorkspaceItem | undefined | null | void> = new vscode.EventEmitter();
    onDidChangeTreeData?: vscode.Event<void | WorkspaceItem | WorkspaceItem[] | null | undefined> | undefined = this._onDidChangeTreeData.event;    

    constructor() {
        WorkspaceCommands.setLogNotesTreeDataProvider(this);
    }

    getTreeItem(element: WorkspaceItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: WorkspaceItem | undefined): vscode.ProviderResult<WorkspaceItem[]> {
        const rootWorkspacesDirectory = LogConfig.getRootWorkspacesDirectory();
        if (!rootWorkspacesDirectory) {
            vscode.window.showInformationMessage('Enhanced Logs: Root Workspaces Directory not configured');
            return Promise.resolve([]);
        }
        
        if (!element) {
            if (pathExists(rootWorkspacesDirectory)) {
                return Promise.resolve(this.getWorkspaceItems(rootWorkspacesDirectory));
            } else {
                vscode.window.showInformationMessage('Enhanced Logs: Root Workspaces Directory does not exist');
                return Promise.resolve([]);
            }
        } else {
            if (!element.label || element.label === "") {
                return Promise.resolve([]);
            } else {
                return Promise.resolve(this.getWorkspaceItems(path.join(rootWorkspacesDirectory, element.label as string)));
            }

        }
    }

    getParent?(element: WorkspaceItem): vscode.ProviderResult<WorkspaceItem> {
        throw new Error("Method not implemented.");
    }

    resolveTreeItem?(item: vscode.TreeItem, element: WorkspaceItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }

    getWorkspaceItems(pathString: string): WorkspaceItem[] {
        try {
          return fs.readdirSync(pathString).map((name) => {
            const fullPath: string = path.join(pathString, name);
            const uri: vscode.Uri = vscode.Uri.file(fullPath);

            if (fs.lstatSync(fullPath).isDirectory()) {
                return new WorkspaceItem(name, uri, vscode.TreeItemCollapsibleState.Collapsed);
            } else {
                return new WorkspaceItem(name, uri, vscode.TreeItemCollapsibleState.None);
            }
        });
        } catch (error) {
            return [];
        }
    }

}

class WorkspaceItem extends vscode.TreeItem {
    constructor(label: string, resourceUri: vscode.Uri, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(resourceUri, collapsibleState);
        this.label = label;
        this.tooltip = resourceUri.fsPath;
        this.command = WorkspaceCommands.getOpenWorkspaceItemCommand(this);
    }
}

export class WorkspaceCommands {
    private static viewProvider: LogWorkspacesTreeDataProvider;

    static setLogNotesTreeDataProvider(viewProvider: LogWorkspacesTreeDataProvider) {
        WorkspaceCommands.viewProvider = viewProvider;
    }

    static registerCommands(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.commands.registerCommand(
            `enhanced-logs.${WorkspaceCommands.openWorkspaceItemCommand.name}`, 
            WorkspaceCommands.openWorkspaceItemCommand));
        context.subscriptions.push(vscode.commands.registerCommand(
            `enhanced-logs.${WorkspaceCommands.refreshWorkspaceCommand.name}`, 
            WorkspaceCommands.refreshWorkspaceCommand));
    }

    static async openWorkspaceItemCommand(workspaceItem: WorkspaceItem) {
        try {
            if (workspaceItem.resourceUri?.fsPath && !fs.lstatSync(workspaceItem.resourceUri.fsPath).isDirectory()) {
                await vscode.commands.executeCommand("vscode.open", workspaceItem.resourceUri);
            }
        } catch (error) {
            return;
        }
    }
    
    static getOpenWorkspaceItemCommand(workspaceItem: WorkspaceItem): WorkspaceCommand {
        return new WorkspaceCommand(
            `Open ${workspaceItem.resourceUri?.path}`, 
            `enhanced-logs.${WorkspaceCommands.openWorkspaceItemCommand.name}`, 
            workspaceItem.resourceUri?.path ?? "", 
            [workspaceItem]);
    }

    static async refreshWorkspaceCommand() {
        WorkspaceCommands.viewProvider._onDidChangeTreeData.fire();
    }
}

class WorkspaceCommand implements vscode.Command {
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

function pathExists(rootWorkspacesDirectory: string) {
    try {
        fs.accessSync(rootWorkspacesDirectory);
    } catch (error) {
        return false;
    }
    return true;
}
