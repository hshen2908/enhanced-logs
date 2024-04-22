import * as vscode from 'vscode';
import * as fs from "fs";
import { LogConfig } from '../../utils/logConfig';

export class LogDefinitionProvider implements vscode.DefinitionProvider {
    static definitionCache: Map<string, vscode.Definition | vscode.LocationLink[] | null | undefined> = new Map<string, vscode.Definition | vscode.LocationLink[] | null | undefined>();
    static pathMatchesCache: Map<string, {filePaths: vscode.Uri[]; searchCount: number;}> = new Map<string, {filePaths: vscode.Uri[]; searchCount: number;}>();

    public async provideDefinition(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | vscode.LocationLink[] | null | undefined> {
        const hoveredLine: string = document.lineAt(position).text;
        const fileSourceRegExp: RegExp = new RegExp(LogConfig.getSourceRegExp());
        const fileSourceString: string | undefined = fileSourceRegExp.exec(hoveredLine)?.at(0);
        const fileSourceIndex: number | undefined = fileSourceRegExp.exec(hoveredLine)?.index;
        const {fileName, filePosition}: {fileName: string | undefined; filePosition: vscode.Position;} = parseFileSourceString(fileSourceString);
        let definitions: vscode.Definition | vscode.LocationLink[] | null | undefined = LogDefinitionProvider.definitionCache.get(`${fileName} ${filePosition.line}:${filePosition.character}`);
        
        if (fileSourceString && fileSourceIndex !== undefined &&
            position.character >= fileSourceIndex &&
            position.character < fileSourceIndex + fileSourceString.length) {
            if (!definitions){
                definitions = getMatchingPaths(fileName).filePaths.map(filePath => new vscode.Location(filePath, filePosition));
                LogDefinitionProvider.definitionCache.set(`${fileName} ${filePosition.line}:${filePosition.character}`, definitions);
            }
        } else {
            return null;
        }
        return definitions;
    }
}

function parseFileSourceString(fileSourceString: string | undefined): {fileName: string | undefined; filePosition: vscode.Position;} {
    if (!fileSourceString) {
        return { fileName: undefined, filePosition: new vscode.Position(0,0) };
    }
    const fileNameRegExp: RegExp = new RegExp(LogConfig.getFileNameRegExp());
    const filePositionRegExp: RegExp = new RegExp(LogConfig.getFilePositionRegExp());
    const fileName: string = fileNameRegExp.exec(fileSourceString)?.at(0) ?? "";
    const positions: number[] = filePositionRegExp.exec(fileSourceString)?.at(0)?.split(":").map(s => Number.parseInt(s)) ?? [0,0];
    const filePosition: vscode.Position = new vscode.Position(positions[0], positions[1]); 
    return {fileName, filePosition};
}

function getMatchingPaths(fileName: string | undefined): {filePaths: vscode.Uri[]; searchCount: number;} {
    if (!fileName) {
        return { filePaths: [], searchCount: 0 };
    }
    
    const pathMatchesFromCache: {filePaths: vscode.Uri[]; searchCount: number;} | undefined = LogDefinitionProvider.pathMatchesCache.get(fileName);
    if (pathMatchesFromCache) {
        return pathMatchesFromCache;
    }

    const allPaths = fs.readdirSync(LogConfig.getRootSearchDirectory(), { recursive: true });
    const searchCount: number = allPaths.length;
    const filePaths: vscode.Uri[] = allPaths
        .filter((path: string | Buffer) => {
            const splitPath: string[] = path.toString().split(new RegExp("[/\\\\]"));
            const currFileName: string | undefined = splitPath.at(splitPath.length - 1);
            return currFileName && currFileName.toLowerCase().match(fileName.toLowerCase());
        })
        .map((fileName: string | Buffer) => {
            return vscode.Uri.file(`${LogConfig.getRootSearchDirectory()}\\${fileName}`)
        });
    return {
        filePaths,
        searchCount
    };
}