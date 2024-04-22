import * as vscode from 'vscode';
import * as fs from "fs";
import { LogConfig } from '../../utils/logConfig';

export class LogHoverProvider implements vscode.HoverProvider {
    static contentCache: Map<string, vscode.Hover | null | undefined> = new Map<string, vscode.Hover | null | undefined>();
    static pathMatchesCache: Map<string, {filePaths: vscode.Uri[]; searchCount: number;}> = new Map<string, {filePaths: vscode.Uri[]; searchCount: number;}>();

    public async provideHover(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null | undefined> {
        const hoveredLine: string = document.lineAt(position).text;
        const fileSourceRegExp: RegExp = new RegExp(LogConfig.getSourceRegExp());
        const fileSourceString: string | undefined = fileSourceRegExp.exec(hoveredLine)?.at(0);
        const fileSourceIndex: number | undefined = fileSourceRegExp.exec(hoveredLine)?.index;
        const {fileName, filePosition}: {fileName: string | undefined; filePosition: vscode.Position;} = parseFileSourceString(fileSourceString);
        let hover: vscode.Hover | null | undefined = LogHoverProvider.contentCache.get(`${fileName} ${filePosition.line}:${filePosition.character}`);

        if (fileSourceString && fileSourceIndex !== undefined &&
                position.character >= fileSourceIndex &&
                position.character < fileSourceIndex + fileSourceString.length) {
            if (!hover){
                const contents: vscode.MarkdownString[] = await getHoverContents(fileName, filePosition); 
                hover = new vscode.Hover(contents);
                LogHoverProvider.contentCache.set(`${fileName} ${filePosition.line}:${filePosition.character}`, hover);
            }
        } else {
            return null;
        }
        return hover;
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

async function getHoverContents(fileName: string | undefined, filePosition: vscode.Position): Promise<vscode.MarkdownString[]> {
    if (!fileName) {
        return [];
    }
    const { filePaths, searchCount }: {filePaths: vscode.Uri[]; searchCount: number;} = getMatchingPaths(fileName);
    const documents: vscode.TextDocument[] = await Promise.all(filePaths.map((async filePath => await vscode.workspace.openTextDocument(filePath))));
    const contents: vscode.MarkdownString[] = documents.flatMap(document => getDocumentDisplayContent(document, filePosition, documents.length <= LogConfig.getMaxMatchesForDetailedOutput()));
    return [new vscode.MarkdownString(`# Matching Files: ${documents.length} | Files Searched: ${searchCount}`), ...contents];
}

function getMatchingPaths(fileName: string | undefined): {filePaths: vscode.Uri[]; searchCount: number;} {
    if (!fileName) {
        return { filePaths: [], searchCount: 0 };
    }
    
    const pathMatchesFromCache: {filePaths: vscode.Uri[]; searchCount: number;} | undefined = LogHoverProvider.pathMatchesCache.get(fileName);
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

function getDocumentDisplayContent(document: vscode.TextDocument, position: vscode.Position, outputDetailed: boolean): vscode.MarkdownString[] {
    const fileInfo: vscode.MarkdownString = new vscode.MarkdownString(`---  \n*[$(file-code) Path: ${document.fileName} | Ln: ${position.line} | Col: ${position.character} | Language: ${document.languageId}](${document.uri.with({ fragment: `L${position.line+1},${position.character}` })})*  \n`, true);
    if (!outputDetailed) {
        return [ fileInfo ];
    }
    return [
        fileInfo
        .appendMarkdown(getDocumentDescriptionContent(document).value),
        getDocumentCodeBlockAtPosition(document, position, LogConfig.getSurroundingLineCount())
    ];
}

function getDocumentDescriptionContent(document: vscode.TextDocument): vscode.MarkdownString {
    const documentLines: string[] = document.getText().split("\n");
    const descriptionContent: vscode.MarkdownString = new vscode.MarkdownString();

    const blockCommentStartRegExp: RegExp = new RegExp("^\\s*/\\*");
    const blockCommentEndRegExp: RegExp = new RegExp("\\*/");
    const lineCommentRegExp: RegExp = new RegExp("^\\s*//");
    const whitespaceRegExp: RegExp = new RegExp("^\\s+$");

    let inBlockComment: boolean = false;
    let inLineComment: boolean = false;
    
    for (const documentLine of documentLines) {
        inBlockComment = blockCommentStartRegExp.test(documentLine) || inBlockComment;
        inLineComment = lineCommentRegExp.test(documentLine);
        if (inBlockComment || inLineComment) {
            descriptionContent.appendMarkdown(documentLine
                .replace(blockCommentStartRegExp, "")
                .replace(blockCommentEndRegExp, "")
                .replace(lineCommentRegExp, "") + "  \n"
            );
        } else if (!whitespaceRegExp.test(documentLine)) {
            break;
        }
        inBlockComment = inBlockComment ? !blockCommentEndRegExp.test(documentLine) : false;
    }
    
    return descriptionContent;
}

function getDocumentCodeBlockAtPosition(document: vscode.TextDocument, position: vscode.Position, surroundingLineCount: number): vscode.MarkdownString {
    if (position.line > (document.lineCount - 1)) {
        return new vscode.MarkdownString();
    }
    
    surroundingLineCount = Math.round(surroundingLineCount);
    const codeBlock: vscode.MarkdownString = new vscode.MarkdownString();
    const start: number = Math.max(position.line - surroundingLineCount, 0);
    const end: number = Math.min(position.line + surroundingLineCount, document.lineCount - 1);
    
    for (let lineNumber = start; lineNumber <= end; lineNumber++) {
        codeBlock.appendCodeblock(document.lineAt(lineNumber).text, document.languageId);
    }

    return codeBlock;
}