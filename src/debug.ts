export function printLine(text: string, offset: number, logger) {
    if (text[offset] === '\n') {
        let start = text.lastIndexOf('\n', offset - 1);
        if (start === -1) {
            start = 0;
        }
        const end = text.indexOf('\n', start);
        const line = text.substring(start, end);
        const decorator = '='.repeat(line.length + 1);
        logger(decorator);
        logger(line);
        logger(' '.repeat(line.length) + '^ (newline)');
        logger(decorator);
        return;
    }
    const start = text.lastIndexOf('\n', offset) + 1;
    const end = text.indexOf('\n', offset);
    const nSpace = offset - start;
    const line = text.substring(start, end);
    const decorator = '='.repeat(line.length);
    /*
    logger({
        start, end, nSpace, line, offset
        , char: text[offset]
    });
    */
    logger(decorator);
    logger(line);
    logger(' '.repeat(nSpace) + '^');
    logger(decorator);
}

export function debugLine(text: string, offset: number) {
    return printLine(text, offset, console.debug.bind(console));
}

export function errorLine(text: string, offset: number) {
    return printLine(text, offset, console.error.bind(console));
}
