/*
    Hello
    // aaa
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Eget felis eget nunc lobortis mattis aliquam. Fermentum leo vel orci porta. Sem nulla pharetra diam sit amet nisl. Lectus arcu bibendum at varius. Quisque id diam vel quam elementum pulvinar. Non blandit massa enim nec dui nunc mattis enim. Egestas diam in arcu cursus euismod quis viverra nibh. Viverra accumsan in nisl nisi scelerisque eu ultrices vitae. Id diam maecenas ultricies mi eget mauris pharetra et.
*/

import * as vscode from 'vscode';
import * as fs from "fs";
import { getLogConfig } from '../src/logConfig';


export class LogHoverProvider implements vscode.HoverProvider {
    public async provideHover(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null | undefined> {
        const hoveredLine: string = document.lineAt(position).text;
        const fileSourceRegExp: RegExp = new RegExp("\\[\\w+\\.\\w+\\, \\d+\\:\\d+\\]");
        const fileSourceString: string | undefined = fileSourceRegExp.exec(hoveredLine)?.at(0);
        const fileSourceIndex: number | undefined = fileSourceRegExp.exec(hoveredLine)?.index;
        const fileSourceObject: {fileName: string; filePosition: vscode.Position;} | undefined = parseFileSourceString(fileSourceString);
        
        if (fileSourceString && fileSourceIndex !== undefined &&
                position.character >= fileSourceIndex &&
                position.character < fileSourceIndex + fileSourceString.length) {
            const contents: vscode.MarkdownString[] = await getHoverContents(fileSourceObject); 
            return { contents };
        } else {
            return null;
        }
    }
}

function parseFileSourceString(fileSourceString: string | undefined): {fileName: string; filePosition: vscode.Position;} | undefined {
    if (!fileSourceString) {
        return undefined;
    }
    const fileNameRegExp: RegExp = new RegExp("\\w+\\.\\w+");
    const filePositionRegExp: RegExp = new RegExp("\\d+\\:\\d+");
    const fileName: string = fileNameRegExp.exec(fileSourceString)?.at(0) ?? "";
    const positions: number[] = filePositionRegExp.exec(fileSourceString)?.at(0)?.split(":").map(s => Number.parseInt(s)) ?? [0,0];
    const filePosition: vscode.Position = new vscode.Position(positions[0], positions[1]); 
    return {fileName, filePosition};
}

async function getHoverContents(fileSourceObject: {fileName: string; filePosition: vscode.Position;} | undefined): Promise<vscode.MarkdownString[]> {
    if (!fileSourceObject || !fileSourceObject.fileName) {
        return [];
    }
    const filePaths: vscode.Uri[] = getMatchingPaths(fileSourceObject);
    const documents: vscode.TextDocument[] = await Promise.all(filePaths.map((async filePath => await vscode.workspace.openTextDocument(filePath))));
    const contents: vscode.MarkdownString[] = documents.flatMap((document) => {
        return [
            new vscode.MarkdownString(`[File Name: ${document.fileName}\n Line: ${fileSourceObject?.filePosition.line}\n Character: ${fileSourceObject?.filePosition.character} $(java)](${document.uri})`, true),
            new vscode.MarkdownString().appendCodeblock(document.getText() ?? "", document.languageId)
        ]
    });
    return contents;
    
    // return [
    //     new vscode.MarkdownString(`[File Name: ${documents.at(0)?.fileName}\n Line: ${fileSourceObject?.filePosition.line}\n Character: ${fileSourceObject?.filePosition.character} $(java)](${documents.at(0)?.uri})`, true),
    //     new vscode.MarkdownString().appendCodeblock(documents.at(0)?.getText() ?? "", documents.at(0)?.languageId)
    // ];
}

function getMatchingPaths(fileSourceObject: {fileName: string; filePosition: vscode.Position;} | undefined): vscode.Uri[] {
    if (!fileSourceObject || !fileSourceObject.fileName) {
        return [];
    }
    return fs.readdirSync("C:\\Users\\Henrique Shen\\enhanced-logs\\aaaa", { recursive: true })
    .filter((path: string | Buffer) => {
        const splitPath: string[] = path.toString().split(new RegExp("[/\\\\]"));
        const fileName: string | undefined = splitPath.at(splitPath.length - 1);
        return fileName && fileName.toLowerCase().match(fileSourceObject.fileName.toLocaleLowerCase());
    })
    .map((fileName: string | Buffer) => {
        return vscode.Uri.file(`C:\\Users\\Henrique Shen\\enhanced-logs\\aaaa\\${fileName}`)
    });
}