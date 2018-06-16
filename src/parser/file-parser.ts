import * as util from "util";
import * as fs from "fs";
import {Module, ModuleParser} from "./module-parser";
import {ParseItem, parseName, parseToken} from "./common";
import {Token, TOKEN, tokenize} from "./tokenizer";
import {toRelativeFilename} from "../utils/path";
import {hasDefine} from "./macro";

let _: any;

export class ParsingFile extends ParseItem {
    dependent_files: ParsingFile[] = [];
    modules: Module[] = [];

    constructor(public idl_filename: string) {
        super();
    }

    toJsCode(): string {
        throw new Error('Unsupported Operation');
    }

    async save() {
        if ('de') {
            throw new Error('not impl');
        }
        // TODO
        return this.modules.map(x => x.toJsCode()).join(';');
    }
}

export interface Context {
    parsingFile: ParsingFile;
}

export async function parse(tokens: Token[], offset: number, ctx: Context): Promise<number> {
    const res = ctx.parsingFile;
    for (; offset < tokens.length;) {
        console.debug({offset, token: tokens[offset]});
        const c = tokens[offset];

        if (c.type === TOKEN.include) {
            offset++;
            console.debug({
                offset,
                0: tokens[0],
                1: tokens[1],
                2: tokens[2],
            });
            [_, offset] = parseToken(tokens, offset, TOKEN.symbol, '"');
            let include_filename: string;
            [include_filename, offset] = parseToken(tokens, offset, TOKEN.word);
            include_filename = toRelativeFilename(res.idl_filename, include_filename);
            [_, offset] = parseToken(tokens, offset, TOKEN.symbol, '"');
            const include_file = await parseFile(include_filename);
            res.dependent_files.push(include_file);
            continue;
        }

        if (c.type === TOKEN.ifndef) {
            offset++;
            let name: string;
            [name, offset] = parseName(tokens, offset);
            const body = [];
            for (; offset < tokens.length;) {
                const c = tokens[offset];
                if (c.type === TOKEN.endif) {
                    break;
                }
                body.push(c);
                offset++;
            }
            console.debug({
                offset,
                body: {
                    length: body.length,
                    first: body[0],
                    last: body[body.length - 1],
                },
                token: {
                    length: tokens.length,
                    first: tokens[0],
                    last: tokens[tokens.length - 1],
                },
            });
            [_, offset] = parseToken(tokens, offset, TOKEN.endif);
            if (hasDefine(name)) {
                // ignore the block
                continue;
            }
            await parseAll(body, 0, ctx);
            continue;
        }

        console.debug('module?');
        let module: Module;
        [module, offset] = new ModuleParser().parse(tokens, offset);
        res.modules.push(module);
    }

}

export async function parseAll(tokens: Token[], offset: number, ctx: Context) {
    for (; offset < tokens.length;) {
        offset = await parse(tokens, offset, ctx);
    }
}

export async function parseFile(filename: string): Promise<ParsingFile> {
    console.log(`parsing ${filename}...`);
    const tokens = tokenize((await util.promisify(fs.readFile)(filename)).toString().trim(), filename);
    const parsingFile = new ParsingFile(filename);
    const context: Context = {parsingFile};
    await parseAll(tokens, 0, context);
    return parsingFile;
}
