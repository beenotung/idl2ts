export function debugLine(text: string, offset: number) {
    let end = 0;
    let start = 0;
    for (; end < offset; end++) {
        start = end;
        end = text.indexOf('\n', end);
    }
    let nSpace = offset - start;
    if (end === 0) {
        end = text.indexOf('\n');
        nSpace = 0;
    }
    const line = text.substring(start, end);
    console.debug('='.repeat(line.length));
    console.debug(line);
    console.debug(' '.repeat(nSpace) + '^');
    if (text[offset] === '\n') {
        const next = text.indexOf('\n', end + 1);
        console.debug(text.substring(end + 1, next));
    }
    console.debug('='.repeat(line.length));
    console.debug({
        start, end, offset, char: text[offset], code: text.charCodeAt(offset)
        , pre: text[offset - 1]
        , post: text[offset + 1]
    });
}