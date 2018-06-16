import {parseFile} from "./parser/file-parser";

export async function transpileFile(idl_filename: string) {
    if (!idl_filename.endsWith('.idl')) {
        console.error(`input file should be .idl`);
    }
    console.log(`compiling ${idl_filename}...`);
    const parsingFile = await parseFile(idl_filename);
    if ('de') {
        throw new Error('not impl');
    }
    console.debug({parsingFile});
}
