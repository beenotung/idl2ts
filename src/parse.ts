import {debugLine} from "./debug";
import {iolist} from "./io";
import {toJsType} from "./type";

export function skipAll(text: string, offset: number, char: string): number {
    for (; text[offset] === char && offset < text.length; offset++) {
    }
    return offset;
}

export function skipOne(text: string, offset: number, char: string, res: iolist): number {
    offset = parseEmpty(text, offset, res);
    if (text[offset] !== char) {
        debugLine(text, offset);
        throw new Error(`expect '${char}' but see ${text[offset]} at [${offset}]`);
    }
    return offset + 1;
}

export function parseSpace(text: string, offset: number): number {
    for (; offset < text.length; offset++) {
        switch (text[offset]) {
            case ' ':
            case '\n':
            case '\t':
                continue;
            default:
                return offset;
        }
    }
}

export function isBetween(a, m, b) {
    return a <= m && m <= b;
}

export function isAlpha(c: string): boolean {
    return isBetween('a', c, 'z')
        || isBetween('A', c, 'Z');
}

export function isNum(c: string): boolean {
    return isBetween('0', c, '9');
}

export function isAlphaNum(c: string): boolean {
    return isNum(c) || isAlpha(c);
}

export const module = 'module';
export const typedef = 'typedef';
export const struct = 'struct';

export function parseName(text: string, offset: number): [iolist, number] {
    const res = [];
    offset = parseEmpty(text, offset, res);
    if (!isAlpha(text[offset])) {
        throw new Error(`expect name, but see '${text[offset]}' at [${offset}]`);
    }
    const start = offset;
    offset++;
    for (; isAlphaNum(text[offset]); offset++) {
    }
    const name = text.substring(start, offset);
    res.push(name);
    return [res, offset];
}

export function parseModule(text: string, offset: number): [iolist, number] {
    const res = [];
    offset += module.length;
    res.push('export module');
    offset = parseEmpty(text, offset, res);
    let name: iolist;
    [name, offset] = parseName(text, offset);
    res.push(' ', name, '{');
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        console.debug('parsing module body');
        debugLine(text, offset);
        offset = parseEmpty(text, offset, res);
        if (text[offset] === '}') {
            break;
        }
        let subTree: iolist;
        [subTree, offset] = parse(text, offset);
        res.push(subTree);
    }
    res.push('}');
    offset = skipOne(text, offset, '}', res);
    return [res, offset];
}

export function parseTypeName(text: string, offset: number): [iolist, number] {
    console.debug('parseTypeName', {offset});
    debugLine(text, offset);
    const res = [];
    const end = text.indexOf(';', offset);
    const type_name = text.substring(offset, end);
    const ss = type_name.split(' ');
    const name = ss.pop();
    let type = ss.join(' ');
    type = toJsType(type);
    res.push(' ', name, ' = ', type, ';');
    offset = end;
    offset = skipOne(text, offset, ';', res);
    return [res, offset];
}

export function parseTypeDef(text: string, offset: number): [iolist, number] {
    const res = [];
    offset += typedef.length;
    res.push('export type');
    offset = parseEmpty(text, offset, res);
    let typeName: iolist;
    [typeName, offset] = parseTypeName(text, offset);
    res.push(typeName);
    return [res, offset];
}

export function parseComment(text: string, offset: number): [iolist, number] {
    const res = [];
    const end = text.indexOf('\n', offset);
    const comment = text.substring(offset, end);
    res.push(comment);
    offset = end + 1;
    return [res, offset];
}

export function parseEmpty(text: string, offset: number, res: iolist): number {
    offset = parseSpace(text, offset);
    if (text.startsWith('//', offset)) {
        let comment: iolist;
        [comment, offset] = parseComment(text, offset);
        res.push(comment as string[]);
    }
    return offset;
}

export function parseStruct(text: string, offset: number): [iolist, number] {
    const res = [];
    offset += struct.length;
    res.push('export interface');
    let name: iolist;
    [name, offset] = parseName(text, offset);
    res.push(' ', name, '{');
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        console.debug('parsing struct fields...');
        debugLine(text, offset);
        offset = parseEmpty(text, offset, res);
        if (text[offset] === '}') {
            break;
        }
        let typeName: iolist = [];
        [typeName, offset] = parseTypeName(text, offset);
        res.push(typeName);
    }
    res.push('}');
    offset = skipOne(text, offset, '}', res);
    offset = skipOne(text, offset, ';', res);
    return [res, offset];
}

export function parse(text: string, offset = 0): [iolist, number] {
    offset = parseSpace(text, offset);
    if (text.startsWith(module, offset)) {
        return parseModule(text, offset);
    }
    if (text.startsWith(typedef, offset)) {
        return parseTypeDef(text, offset);
    }
    if (text.startsWith('//', offset)) {
        return parseComment(text, offset);
    }
    if (text.startsWith(struct, offset)) {
        return parseStruct(text, offset);
    }
    console.error('end, offset=', offset);
    console.error('total length=', text.length);
    debugLine(text, offset);
    throw new Error('unexpected text');
}
