#!/usr/bin/env node

import {transpileFile} from "./transpiler";

async function main() {
    console.debug = () => {};
    if (process.argv.length != 3) {
        console.error('expect 1 argument of IDL filename');
        return process.exit(1);
    }
    const filename = process.argv[2];
    await transpileFile(filename);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
