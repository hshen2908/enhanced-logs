import * as vscode from 'vscode';
import { LOG_MODE } from './utils/logMode';
import { LogHoverProvider } from './providers/language/logHover';
import { LogDefinitionProvider } from './providers/language/logDefinition';
import { LogImplementationProvider } from './providers/language/logImplementation';
import { LogWorkspacesTreeDataProvider, WorkspaceCommands } from './providers/views/logWorkspaces';
import { LogProblemsTreeDataProvider, ProblemCommands } from './providers/views/logProblems';
import { LogNotesTreeDataProvider, NoteCommands } from './providers/views/logNotes';

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context);
	registerProviders(context);
}

export function deactivate() {}

function registerCommands(context: vscode.ExtensionContext): void {
	WorkspaceCommands.registerCommands(context);
	NoteCommands.registerCommands(context);
	ProblemCommands.registerCommands(context);
}

function registerProviders(context: vscode.ExtensionContext): void {
	context.subscriptions.push(vscode.languages.registerHoverProvider(LOG_MODE, new LogHoverProvider()));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(LOG_MODE, new LogDefinitionProvider()));
	context.subscriptions.push(vscode.languages.registerImplementationProvider(LOG_MODE, new LogImplementationProvider()));

	const workspacesProvider: LogWorkspacesTreeDataProvider = new LogWorkspacesTreeDataProvider();
	const notesProvider: LogNotesTreeDataProvider = new LogNotesTreeDataProvider(context);
	const problemsProvider: LogProblemsTreeDataProvider = new LogProblemsTreeDataProvider();
	context.subscriptions.push(vscode.window.registerTreeDataProvider(LogWorkspacesTreeDataProvider.viewId, workspacesProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider(LogNotesTreeDataProvider.viewId, notesProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider(LogProblemsTreeDataProvider.viewId, problemsProvider));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
		if (e.affectsConfiguration("enhanced-logs")) {
			LogHoverProvider.contentCache.clear();
			LogDefinitionProvider.definitionCache.clear();
			LogImplementationProvider.implementationCache.clear();
			workspacesProvider._onDidChangeTreeData.fire()
			notesProvider._onDidChangeTreeData.fire()
			problemsProvider._onDidChangeTreeData.fire()
		}
	}));
}