import {formatToken, TOKEN, Token} from "./tokenizer";

export interface Type<A> extends Function {
    new(...args: any[]): A;
}

export abstract class ParseItem {
    abstract toJsCode(): string;
}

export abstract class Parser<A extends ParseItem> {
    abstract parse(tokens: Token[], offset: number): [A, number];
}

export function parse<A extends ParseItem>(constructor: Type<Parser<A>>, tokens: Token[], offset: number): [A, number] {
    const parser = new constructor();
    return parser.parse(tokens, offset);
}

export function parseToken(tokens: Token[], offset: number, type: string, value?: string): [string, number] {
    if (offset >= tokens.length) {
        throw new Error(`expect token '${type}' '${value || ''}', but no more tokens`);
    }
    const c = tokens[offset];
    if (c.type !== type) {
        throw new Error(`expect token '${type}' '${value || ''}', but see ${formatToken(c)}`);
    }
    if (!!value && c.value !== value) {
        throw new Error(`expect token '${type}' '${value || ''}', but see ${formatToken(c)}`);
    }
    return [c.value, offset + 1];
}

export function parseName(tokens: Token[], offset: number): [string, number] {
    return parseToken(tokens, offset, TOKEN.word);
}

export function parseSymbol(token: Token[], offset: number, s: string): [string, number] {
    return parseToken(token, offset, TOKEN.word, s);
}

export function parseKeyword(token: Token[], offset: number, type: string): [string, number] {
    return parseToken(token, offset, type);
}
