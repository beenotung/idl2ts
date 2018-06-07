/** @return line number starting from 1 */
export function getLineNum(text: string, offset: number): number {
    let line = 1;
    for (let i = 0; i < offset; i++) {
        if (text[i] === '\n') {line++; }
    }
    return line;
}
