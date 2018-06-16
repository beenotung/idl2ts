import {ParseItem, Parser} from "./common";
import {ParsingFile} from "./file-parser";
import {Token} from "./tokenizer";

export class Include extends ParseItem {
    parsingFile: ParsingFile;

    toJsCode(): string {
        throw new Error('not impl');
        // idlToTsFilename(this.parsingFile.filename,)
        // const filename = this.parsingFile.ts_filename.replace('\.ts', '');
        // return `import * from '${filename}';`;
    }
}

export class IncludeParser extends Parser<Include> {
    parse(tokens: Token[], offset: number): [Include, number] {
        return undefined;
    }
}
