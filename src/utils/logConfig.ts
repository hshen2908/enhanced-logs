import * as vscode from "vscode";
import { LogHoverProvider } from "../providers/language/logHover";
import { LogDefinitionProvider } from "../providers/language/logDefinition";
import { LogImplementationProvider } from "../providers/language/logImplementation";
import path from "path";

export class LogConfig {
    
    private static config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("enhanced-logs");

    private static getConfig(): vscode.WorkspaceConfiguration {
        LogConfig.config = vscode.workspace.getConfiguration("enhanced-logs");
        return LogConfig.config;
    }

    public static getRootWorkspacesDirectory(): string {
        return path.resolve(LogConfig.getConfig().get("rootWorkspacesDirectory") as string);
    }

    public static getRootSearchDirectory(): string {
        return path.resolve(LogConfig.getConfig().get("rootSearchDirectory") as string);
    }

    public static getSourceRegExp(): string {
        return LogConfig.getConfig().get("sourceRegExp") as string;
    }

    public static getFileNameRegExp(): string {
        return LogConfig.getConfig().get("fileNameRegExp") as string;
    }

    public static getFilePositionRegExp(): string {
        return LogConfig.getConfig().get("filePositionRegExp") as string;
    }

    public static getSurroundingLineCount(): number {
        return LogConfig.getConfig().get("surroundingLineCount") as number;
    }

    public static getMaxMatchesForDetailedOutput(): number {
        return LogConfig.getConfig().get("maxMatchesForDetailedOutput") as number;
    }
    
    static getErrorRegExp(): string | RegExp {
        return LogConfig.getConfig().get("errorRegExp") as string;
    }
}