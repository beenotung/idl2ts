// TODO make an error version
export function debugLine(text: string, offset: number) {
    if (text[offset] === '\n') {
        let start = text.lastIndexOf('\n', offset - 1);
        if (start === -1) {
            start = 0;
        }
        const end = text.indexOf('\n', start);
        const line = text.substring(start, end);
        const decorator = '='.repeat(line.length + 1);
        console.debug(decorator);
        console.debug(line);
        console.debug(' '.repeat(line.length) + '^ (newline)');
        console.debug(decorator);
        return;
    }
    const start = text.lastIndexOf('\n', offset) + 1;
    const end = text.indexOf('\n', offset);
    const nSpace = offset - start;
    const line = text.substring(start, end);
    const decorator = '='.repeat(line.length);
    /*
    console.debug({
        start, end, nSpace, line, offset
        , char: text[offset]
    });
    */
    console.debug(decorator);
    console.debug(line);
    console.debug(' '.repeat(nSpace) + '^');
    console.debug(decorator);
}
