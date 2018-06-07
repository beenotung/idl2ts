import * as util from "util";
import * as fs from "fs";
import {parseFile} from "./parse";
import {iolist_to_string} from "./io";

export async function transpileFile(filename: string) {
    if (!filename.endsWith('.idl')) {
        console.error(`input file should be .idl`);
    }
    console.error(`reading ${filename}...`);
    const tree = await parseFile(filename);
    // console.debug('tree=', tree);
    const code = iolist_to_string(tree);
    const tsFilename = filename.replace('.idl', '.ts');
    await util.promisify(fs.writeFile)(tsFilename, code);
    console.log('saved to ' + tsFilename);
}
