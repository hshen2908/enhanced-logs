"use strict";
/*
    Hello
    // aaa
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Eget felis eget nunc lobortis mattis aliquam. Fermentum leo vel orci porta. Sem nulla pharetra diam sit amet nisl. Lectus arcu bibendum at varius. Quisque id diam vel quam elementum pulvinar. Non blandit massa enim nec dui nunc mattis enim. Egestas diam in arcu cursus euismod quis viverra nibh. Viverra accumsan in nisl nisi scelerisque eu ultrices vitae. Id diam maecenas ultricies mi eget mauris pharetra et.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
class LogHoverProvider {
    async provideHover(document, position, token) {
        const hoveredLine = document.lineAt(position).text;
        const fileSourceRegExp = new RegExp("\\[\\w+\\.\\w+\\, \\d+\\:\\d+\\]");
        const fileSourceString = fileSourceRegExp.exec(hoveredLine)?.at(0);
        const fileSourceIndex = fileSourceRegExp.exec(hoveredLine)?.index;
        const fileSourceObject = parseFileSourceString(fileSourceString);
        if (fileSourceString && fileSourceIndex !== undefined &&
            position.character >= fileSourceIndex &&
            position.character < fileSourceIndex + fileSourceString.length) {
            const contents = await getHoverContents(fileSourceObject);
            return { contents };
        }
        else {
            return null;
        }
    }
}
exports.LogHoverProvider = LogHoverProvider;
function parseFileSourceString(fileSourceString) {
    if (!fileSourceString) {
        return undefined;
    }
    const fileNameRegExp = new RegExp("\\w+\\.\\w+");
    const filePositionRegExp = new RegExp("\\d+\\:\\d+");
    const fileName = fileNameRegExp.exec(fileSourceString)?.at(0) ?? "";
    const positions = filePositionRegExp.exec(fileSourceString)?.at(0)?.split(":").map(s => Number.parseInt(s)) ?? [0, 0];
    const filePosition = new vscode.Position(positions[0], positions[1]);
    return { fileName, filePosition };
}
async function getHoverContents(fileSourceObject) {
    if (!fileSourceObject || !fileSourceObject.fileName) {
        return [];
    }
    const filePaths = getMatchingPaths(fileSourceObject);
    const documents = await Promise.all(filePaths.map((async (filePath) => await vscode.workspace.openTextDocument(filePath))));
    const contents = documents.flatMap((document) => {
        return [
            new vscode.MarkdownString(`[File Name: ${document.fileName}\n Line: ${fileSourceObject?.filePosition.line}\n Character: ${fileSourceObject?.filePosition.character} $(java)](${document.uri})`, true),
            new vscode.MarkdownString().appendCodeblock(document.getText() ?? "", document.languageId)
        ];
    });
    return contents;
    // return [
    //     new vscode.MarkdownString(`[File Name: ${documents.at(0)?.fileName}\n Line: ${fileSourceObject?.filePosition.line}\n Character: ${fileSourceObject?.filePosition.character} $(java)](${documents.at(0)?.uri})`, true),
    //     new vscode.MarkdownString().appendCodeblock(documents.at(0)?.getText() ?? "", documents.at(0)?.languageId)
    // ];
}
function getMatchingPaths(fileSourceObject) {
    if (!fileSourceObject || !fileSourceObject.fileName) {
        return [];
    }
    return fs.readdirSync("C:\\Users\\Henrique Shen\\enhanced-logs\\aaaa", { recursive: true })
        .filter((path) => {
        const splitPath = path.toString().split(new RegExp("[/\\\\]"));
        const fileName = splitPath.at(splitPath.length - 1);
        return fileName && fileName.toLowerCase().match(fileSourceObject.fileName.toLocaleLowerCase());
    })
        .map((fileName) => {
        return vscode.Uri.file(`C:\\Users\\Henrique Shen\\enhanced-logs\\aaaa\\${fileName}`);
    });
}
//# sourceMappingURL=test.js.map