import * as vscode from "vscode";
import * as fs from "fs";
import * as crypto from "crypto";
import path from "path";
import { LogConfig } from "../../utils/logConfig";

export class LogNotesTreeDataProvider implements vscode.TreeDataProvider<NoteItem> {
    static readonly viewId: string = "enhanced-logs-activitybar-notes";
    readonly context: vscode.ExtensionContext;
    public _onDidChangeTreeData: vscode.EventEmitter<NoteItem | undefined | null | void> = new vscode.EventEmitter();
    onDidChangeTreeData?: vscode.Event<void | NoteItem | NoteItem[] | null | undefined> | undefined = this._onDidChangeTreeData.event;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        NoteCommands.setLogNotesTreeDataProvider(this);
        vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor | undefined) => {
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: NoteItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: NoteItem | undefined): vscode.ProviderResult<NoteItem[]> {
        const rootWorkspacesDirectory = LogConfig.getRootWorkspacesDirectory();
        if (!rootWorkspacesDirectory) {
            vscode.window.showInformationMessage('Enhanced Logs: Root Workspaces Directory not configured');
            return Promise.resolve([]);
        }
        if (vscode.window.activeTextEditor?.document) {
            return this.getLogFileNotes(vscode.window.activeTextEditor?.document.uri)
        } else {
            return Promise.resolve([]);
        }
    }

    getParent?(element: NoteItem): vscode.ProviderResult<NoteItem> {
        throw new Error("Method not implemented.");
    }

    resolveTreeItem?(item: vscode.TreeItem, element: NoteItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }

    async getLogFileNotes(resourceUri: vscode.Uri): Promise<NoteItem[]> {
        if (!resourceUri.fsPath.endsWith(".log")) {
            return [];
        }
        
        const document: vscode.TextDocument = await vscode.workspace.openTextDocument(resourceUri);
        
        // this.context.globalState.update(resourceUri.fsPath, undefined)
        const noteObjects: {id: string, text: string, range: { start: number, end: number}, color: string}[] = this.context.globalState.get(resourceUri.fsPath, []);
        LogDecorations.removeNoteDecorations(vscode.window.activeTextEditor);
        const noteItems: NoteItem[] = noteObjects.map((noteObject) => {
            return new NoteItem(noteObject.id, noteObject.text, noteObject.range, noteObject.color, resourceUri, vscode.TreeItemCollapsibleState.None);
        });
        LogDecorations.addNoteDecorations(vscode.window.activeTextEditor, noteItems);
        return noteItems;
    }
}

class NoteItem extends vscode.TreeItem {
    public noteId: string;
    public color: string;
    public range: { start: number, end: number };
    constructor(id: string, label: string, range: { start: number, end: number }, color: string, resourceUri: vscode.Uri, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(resourceUri.with({ fragment: `L${range.start},${0}` }), collapsibleState);
        this.noteId = id;
        this.label = label;
        this.color = color;
        this.range = range;
        this.tooltip = `${resourceUri.fsPath} | Start: ${range.start} | End: ${range.end}\n\n${label}`;
        this.description = `Start: ${range.start} | End: ${range.end}`;
        this.command = NoteCommands.getOpenNoteItemCommand(this); 
        this.iconPath = new vscode.ThemeIcon("notebook", new vscode.ThemeColor(`charts.${color}`));
    }
}

export class NoteCommands {
    private static viewProvider: LogNotesTreeDataProvider;
    static setLogNotesTreeDataProvider(viewProvider: LogNotesTreeDataProvider) {
        NoteCommands.viewProvider = viewProvider;
    }
    private static context: vscode.ExtensionContext;
    static registerCommands(context: vscode.ExtensionContext) {
        NoteCommands.context = context;
        context.subscriptions.push(vscode.commands.registerCommand(
            `enhanced-logs.${NoteCommands.createNoteItemCommand.name}`, 
            NoteCommands.createNoteItemCommand));
        context.subscriptions.push(vscode.commands.registerCommand(
            `enhanced-logs.${NoteCommands.openNoteItemCommand.name}`, 
            NoteCommands.openNoteItemCommand));
        context.subscriptions.push(vscode.commands.registerCommand(
            `enhanced-logs.${NoteCommands.editNoteItemCommand.name}`, 
            NoteCommands.editNoteItemCommand));
        context.subscriptions.push(vscode.commands.registerCommand(
            `enhanced-logs.${NoteCommands.deleteNoteItemCommand.name}`, 
            NoteCommands.deleteNoteItemCommand));
    }

    static async createNoteItemCommand() {
        try {
            const resourceUri: vscode.Uri | undefined = vscode.window.activeTextEditor?.document.uri;
            const inputNote: { text: string; range: { start: number; end: number; }; color: string; } | undefined = await NoteCommands.getUserNoteInputs();

            if (inputNote && resourceUri?.fsPath && !fs.lstatSync(resourceUri.fsPath).isDirectory() && resourceUri.fsPath.endsWith(".log")) {
                const noteObjects: {id: string, text: string, range: { start: number, end: number}, color: string}[] = NoteCommands.context.globalState.get(resourceUri.fsPath, []);
                noteObjects.push({
                    id: crypto.randomUUID(),
                    text: inputNote.text,
                    range: { start: inputNote.range.start, end: inputNote.range.end},
                    color: inputNote.color
                });
                NoteCommands.context.globalState.update(resourceUri.fsPath, noteObjects);
            }
        } catch (error) {
            return;
        } finally {
            NoteCommands.viewProvider._onDidChangeTreeData.fire();
        }
    }
    
    static getCreateNoteItemCommand(noteItem: NoteItem): NoteCommand {
        return new NoteCommand(
            `Open ${noteItem.resourceUri?.path}`, 
            `enhanced-logs.${NoteCommands.createNoteItemCommand.name}`, 
            noteItem.resourceUri?.path ?? "", 
            [noteItem]);
    }

    static async openNoteItemCommand(noteItem: NoteItem) {
        try {
            if (noteItem.resourceUri?.fsPath && !fs.lstatSync(noteItem.resourceUri.fsPath).isDirectory()) {
                await vscode.commands.executeCommand("vscode.open", noteItem.resourceUri);
                const decoration = vscode.window.createTextEditorDecorationType({
                    backgroundColor: LogDecorations.colorToHexMap.get(noteItem.color)
                });
                vscode.window.activeTextEditor?.setDecorations(decoration, [new vscode.Range(new vscode.Position(noteItem.range.start-1, 0), new vscode.Position(noteItem.range.end-1, 9999))]);
                setTimeout(() => {
                    vscode.window.activeTextEditor?.setDecorations(decoration, []);   
                }, 300)
            }
        } catch (error) {
            return;
        } 
    }
    
    static getOpenNoteItemCommand(noteItem: NoteItem): NoteCommand {
        return new NoteCommand(
            `Open ${noteItem.resourceUri?.path}`, 
            `enhanced-logs.${NoteCommands.openNoteItemCommand.name}`, 
            noteItem.resourceUri?.path ?? "", 
            [noteItem]);
    }

    static async editNoteItemCommand(noteItem: NoteItem) {
        try {
            const inputNote: { text: string; range: { start: number; end: number; }; color: string; } | undefined = await NoteCommands.getUserNoteInputs(noteItem.label?.toString(), noteItem.range.start, noteItem.range.end);

            if (inputNote && noteItem.noteId && noteItem.resourceUri?.fsPath && !fs.lstatSync(noteItem.resourceUri.fsPath).isDirectory()) {
                const noteObjects: {id: string, text: string, range: { start: number, end: number}, color: string}[] = NoteCommands.context.globalState.get(noteItem.resourceUri.fsPath, []);
                noteObjects[(noteObjects.findIndex((noteObject) => noteObject.id === noteItem.noteId))] = {
                    id: noteItem.noteId,
                    text: inputNote.text,
                    range: { start: inputNote.range.start, end: inputNote.range.end},
                    color: inputNote.color
                }
                NoteCommands.context.globalState.update(noteItem.resourceUri.fsPath, noteObjects);
            }
        } catch (error) {
            return;
        } finally {
            NoteCommands.viewProvider._onDidChangeTreeData.fire();
        }
    }
    
    static geteditNoteItemCommand(noteItem: NoteItem): NoteCommand {
        return new NoteCommand(
            `Open ${noteItem.resourceUri?.path}`, 
            `enhanced-logs.${NoteCommands.editNoteItemCommand.name}`, 
            noteItem.resourceUri?.path ?? "", 
            [noteItem]);
    }

    static async deleteNoteItemCommand(noteItem: NoteItem) {
        try {
            if (noteItem.resourceUri?.fsPath && !fs.lstatSync(noteItem.resourceUri.fsPath).isDirectory()) {
                const noteObjects: {id: string, text: string, range: { start: number, end: number}, color: string}[] = NoteCommands.context.globalState.get(noteItem.resourceUri.fsPath, []);
                NoteCommands.context.globalState.update(noteItem.resourceUri.fsPath, noteObjects.filter((noteObject) => noteObject.id !== noteItem.noteId));
            }
        } catch (error) {
            return;
        } finally {
            NoteCommands.viewProvider._onDidChangeTreeData.fire();
        }
    }
    
    static getdeleteNoteItemCommand(noteItem: NoteItem): NoteCommand {
        return new NoteCommand(
            `Open ${noteItem.resourceUri?.path}`, 
            `enhanced-logs.${NoteCommands.deleteNoteItemCommand.name}`, 
            noteItem.resourceUri?.path ?? "", 
            [noteItem]);
    }

    private static async getUserNoteInputs(defaultText?: string,
        defaultStart?: number,
        defaultEnd?: number): Promise<{ text: string; range: { start: number; end: number; }; color: string; } | undefined> {
        const text: string | undefined = await vscode.window.showInputBox({
            title: "Note Text:",
            value: defaultText
        });
        if(!text) {
            return;
        }
        
        const color: string | undefined = await vscode.window.showQuickPick(LogDecorations.colors, {
            title: "Note Color:"
        });
        if(!color) {
            return;
        }

        const startLineNumberInput: string | undefined = await vscode.window.showInputBox({
            title: "Start Line Number:",
            value: defaultStart?.toString(),
            validateInput: (text) => (new RegExp("^\\s*\\d+\\s*$").test(text) && Number.parseInt(text) > 0) ? "" : "Enter a valid line number"
        });
        if(!startLineNumberInput) {
            return;
        }
        const startLineNumber = Number.parseInt(startLineNumberInput);

        const endLineNumberInput: string | undefined = await vscode.window.showInputBox({
            title: "End Line Number:",
            value: defaultEnd?.toString(),
            validateInput: (text) => (new RegExp("^\\s*\\d+\\s*$").test(text) && Number.parseInt(text) >= startLineNumber) ? "" : `Enter a valid line number greater than or equal to ${startLineNumber}`
        });
        if(!endLineNumberInput) {
            return;
        }
        const endLineNumber = Number.parseInt(endLineNumberInput);
        return { text, color, range: { start: startLineNumber, end: endLineNumber}}
    }
}

class NoteCommand implements vscode.Command {
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

class LogDecorations {
    static readonly colors: string[] = [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "purple"
    ];
    static readonly colorToHexMap: Map<string, string> = new Map([
        ["red", "#f14c4c"],
        ["orange", "#d18616"],
        ["yellow", "#cca700"],
        ["green", "#89d185"],
        ["blue", "#3794ff"],
        ["purple", "#b180d7"]
    ]);
    static readonly noteColorsDecorationsMap: Map<string, vscode.TextEditorDecorationType> = new Map();
    static readonly noteDecorations: vscode.TextEditorDecorationType[] = LogDecorations.colors.map((color: string) => {
        const decoration: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: `${__dirname}/../../../resources/${color}.png`,
            gutterIconSize: "cover",
            // backgroundColor: LogDecorations.colorToHexMap.get(color),
            overviewRulerColor: LogDecorations.colorToHexMap.get(color)
        });
        LogDecorations.noteColorsDecorationsMap.set(color, decoration);
        return decoration;
    });

    static addNoteDecorations(textEditor: vscode.TextEditor | undefined, noteItems: NoteItem[]) {
        const currentDecorationsMap: Map<string, vscode.Range[]> = new Map();
        noteItems.forEach((noteItem: NoteItem) => {
            if (!currentDecorationsMap.get(noteItem.color)) {
                currentDecorationsMap.set(noteItem.color, []);
            }
            currentDecorationsMap.get(noteItem.color)?.push(new vscode.Range(new vscode.Position(noteItem.range.start-1, 0), new vscode.Position(noteItem.range.end-1, 9999)));
        });

        if (textEditor) {  
            LogDecorations.colors.forEach((color: string) => {
                const colorDecoration: vscode.TextEditorDecorationType | undefined = LogDecorations.noteColorsDecorationsMap.get(color);
                if (colorDecoration) {
                    textEditor.setDecorations(colorDecoration, currentDecorationsMap.get(color) ?? []);
                }
            });
        }
    }

    static removeNoteDecorations(textEditor: vscode.TextEditor | undefined) {
        if (textEditor) {
            LogDecorations.noteDecorations.forEach((decorator: vscode.TextEditorDecorationType) => {
                textEditor.setDecorations(decorator, []);
            });
        }
    }
}