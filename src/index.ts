import * as fs from 'fs';
import {parse} from "./parse";
import {iolist_to_string} from "./io";

async function main() {
    if (process.argv.length != 3) {
        console.error('expect 1 argument of IDL filename');
        return process.exit(1);
    }
    const filename = process.argv[2];
    if (!filename.endsWith('.idl')) {
        console.error(`input file should be .idl`);
    }
    console.error(`reading ${filename}...`);
    fs.readFile(filename, (err, data) => {
        if (err) {
            console.error(err);
            return process.exit(1);
        }
        const text = data.toString();
        const tree = parse(text);
        console.debug('tree=', tree);
        const code = iolist_to_string(tree);
        const tsFilename = filename.replace('.idl', '.ts');
        fs.writeFile(tsFilename, code, err => {
            if (err) {
                console.error(err);
                return process.exit(1);
            }
            console.log('saved to ' + tsFilename);
        });
    });
}

main();
