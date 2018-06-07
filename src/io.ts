import * as util from "util";
import * as fs from "fs";
import {getDir, idlToTsFilename} from "./path";

export type one_or_more<T> = T | T[];
export type iolist = Array<one_or_more<string>>;

export function iolist_to_string(iolist: iolist, acc = ''): string {
    iolist.forEach(c => {
        if (Array.isArray(c)) {
            acc = iolist_to_string(c, acc);
        } else {
            acc += c;
        }
    });
    return acc;
}

export async function writeToFile(iolist: iolist, idlFilename: string, moduleName: string) {
    const tsFilename = idlToTsFilename(idlFilename, moduleName);
    const dir = getDir(tsFilename);
    if (!await util.promisify(fs.exists)(dir)) {
        await util.promisify(fs.mkdir)(dir);
    }
    await util.promisify(fs.writeFile)(tsFilename, iolist_to_string(iolist));
    console.log(`saved to ${tsFilename}`);
}
