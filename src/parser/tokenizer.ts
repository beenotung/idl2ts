import {isSpace} from "./space";

export const KEYWORD = {
    include: '#include',
    ifdef: '#ifdef',
    ifndef: '#ifndef',
    endif: '#endif',

    module: 'module',
    typedef: 'typedef',
    struct: 'sturct',
    interface: 'interface',
    exception: 'exception',
};
/* reversed lookup */
export const KEYWORD_TOKEN = Object.keys(KEYWORD).reduce((acc, c) => {
    acc[KEYWORD[c]] = c;
    return acc;
}, {});
export const TOKEN = {
    ...KEYWORD,
    symbol: 'symbol',
    word: 'word',
    comment: 'comment',
    multiline_comment: 'multiline_comment',
};
export const SYMBOLS = '#()<>/*;,\'"';

export function is_symbol(c: string): boolean {
    return SYMBOLS.indexOf(c) !== -1;
}

export interface Token {
    type: string
    value?: string
    filename: string
    /* start from 1 */
    line: number
    /* start from 1 */
    col: number
}

export function formatToken(token: Token): string {
    return JSON.stringify(token);
}

export function printToken(token: Token): string {
    if (token.type in KEYWORD_TOKEN) {
        return token.type;
    }
    return token.value;
}

export function isMatch(pattern: string, text: string, offset: number): boolean {
    if (!text.startsWith(pattern, offset)) {
        return false;
    }
    const c = text[offset + pattern.length];
    if (isSpace(c)) {
        return true;
    }
    return SYMBOLS.indexOf(c) !== -1;
}

export function tokenize_string(text: string, filename: string): Token[] {
    const tokens: Token[] = [];

    let line = 1;
    let col = 1;

    function emit(s: string, line: number, col: number) {
        if (s === '') {
            return;
        }
        const type = (s in KEYWORD_TOKEN)
            ? s
            : is_symbol(s)
                ? TOKEN.symbol
                : TOKEN.word
        ;
        const token: Token = {
            filename, line, col,
            type,
        };
        switch (token.type) {
            case TOKEN.word:
            case TOKEN.symbol:
                token.value = s;
        }
        tokens.push(token);
    }

    let acc: string = '';
    let acc_line: number = line;
    let acc_col: number = col;

    function resetAcc() {
        acc = '';
        acc_line = line;
        acc_col = col;
    }

    let offset = 0;
    for (; offset < text.length; offset++) {
        const c = text[offset];

        if (text.startsWith('//', offset)) {
            emit(acc, acc_line, acc_col);
            resetAcc();
            let end = text.indexOf('\n', offset);
            if (end === -1) {
                end = text.length;
            }
            const comment = text.substring(offset + 2, end);
            tokens.push({
                filename, line, col,
                type: TOKEN.comment,
                value: comment,
            });
            offset = end;
            continue;
        }
        if (text.startsWith('/*', offset)) {
            emit(acc, acc_line, acc_col);
            resetAcc();
            const end = text.indexOf('*/', offset);
            if (end === -1) {
                throw new Error('multi-line comment is not terminated');
            }
            const comment = text.substring(offset + 2, end);
            tokens.push({
                filename, line, col,
                type: TOKEN.multiline_comment,
                value: comment,
            });
            for (; offset <= end + 1; offset++) {
                const c = text[offset];
                if (c === '\n') {
                    line++;
                    col = 1;
                } else {
                    col++;
                }
            }
            // offset = end + 1;
            continue;
        }

        if (c === '\n') {
            line++;
            col = 1;
        } else if (c !== '\r') {
            col++;
        }
        if (isSpace(c)) {
            emit(acc, acc_line, acc_col);
            resetAcc();
            continue;
        }
        if (c !== '#' && is_symbol(c)) {
            emit(acc, acc_line, acc_col);
            emit(c, line, col);
            resetAcc();
            continue;
        }
        acc += c;
    }
    console.debug(tokens);
    return tokens;
}

export function tokenize(text: string, filename: string): Token[] {
    return tokenize_string(text, filename);
}
