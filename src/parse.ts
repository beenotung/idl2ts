import {debugLine} from "./debug";
import {iolist, writeToFile} from "./io";
import {registerEnum, registerStruct, registerType, toJsType} from "./type";
import {isNDef, registerDefine} from "./macro";
import * as util from "util";
import * as fs from "fs";
import {transpileFile} from "./transpiler";
import {getDir} from "./path";
import {getLineNum} from "./string";

export const ifndef = '#ifndef';
export const endif = '#endif';
export const define = '#define';
export const include = '#include';

export const module = 'module';
export const typedef = 'typedef';
export const struct = 'struct';
export const exception = 'exception';
export const enum_ = 'enum';

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

export function isNameChar(c: string): boolean {
    return c === '_' || isAlphaNum(c);
}

export function parseName(text: string, offset: number): [string, number] {
    console.debug('parseName', {offset});
    debugLine(text, offset);
    const first = text[offset];
    if (!(first === '_' || isAlpha(first))) {
        debugLine(text, offset);
        throw new Error(`expect name, but see '${text[offset]}' at [${offset}]`);
    }
    const start = offset;
    offset++;
    for (; offset < text.length && isNameChar(text[offset]); offset++) {
    }
    const name = text.substring(start, offset);
    return [name, offset];
}

export async function parseModule(text: string, offset: number, selfFilename: string): Promise<[iolist, number]> {
    const res = [];
    offset += module.length;
    // res.push('export module');
    offset = parseEmpty(text, offset, res);
    let name: string;
    [name, offset] = parseName(text, offset);
    // res.push(' ', name, '{');
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        console.debug('parsing module body', {offset});
        debugLine(text, offset);
        offset = parseEmpty(text, offset, res);
        if (text[offset] === '}') {
            break;
        }
        let subTree: iolist;
        [subTree, offset] = await parse(text, offset, selfFilename);
        res.push(subTree);
    }
    // res.push('}');
    offset = skipOne(text, offset, '}', res);
    offset = skipOne(text, offset, ';', res);
    await writeToFile(res, selfFilename, name);
    // return [res, offset];
    return [[], offset];
}

export interface TypeName {
    type: string,
    name: string
}

export function parseTypeName(text: string, offset: number, res: iolist): [TypeName, number] {
    console.debug('parseTypeName', {offset});
    debugLine(text, offset);
    const end = text.indexOf(';', offset);
    const type_name = text.substring(offset, end);
    const ss = type_name.split(' ');
    const name = ss.pop();
    registerType(name);
    let type = ss.join(' ');
    type = toJsType(type);
    offset = end;
    offset = skipOne(text, offset, ';', res);
    return [{type, name}, offset];
}

export function parseTypeDef(text: string, offset: number): [iolist, number] {
    const res = [];
    offset += typedef.length;
    res.push('export type');
    offset = parseEmpty(text, offset, res);
    let typeName: TypeName;
    [typeName, offset] = parseTypeName(text, offset, res);
    res.push(' ', typeName.name, '=', typeName.type, ';');
    return [res, offset];
}

export function parseComment(text: string, offset: number): [iolist, number] {
    const res = [];
    const end = text.indexOf('\n', offset);
    const comment = text.substring(offset, end);
    res.push(comment, '\n');
    offset = end + 1;
    return [res, offset];
}

export function parseBlockComment(text: string, offset: number): [iolist, number] {
    const res = [];
    const end = text.indexOf('*/', offset);
    const comment = text.substring(offset, end);
    res.push(comment, '*/');
    offset = end + 2;
    return [res, offset];
}

export function parseEmpty(text: string, offset: number, res: iolist): number {
    for (; ;) {
        const start = offset;
        offset = parseSpace(text, offset);
        const end = offset;
        const restoreSpace = () => {
            res.push(text.substring(start, end));
        };
        if (text.startsWith('//', offset)) {
            let comment: iolist;
            [comment, offset] = parseComment(text, offset);
            restoreSpace();
            res.push(comment as string[]);
        } else if (text.startsWith('/*', offset)) {
            let comment: iolist;
            [comment, offset] = parseBlockComment(text, offset);
            restoreSpace();
            res.push(comment as string[]);
        } else {
            break;
        }
    }
    return offset;
}

export function parseStruct(text: string, offset: number): [iolist, number] {
    console.debug('parseStruct', {offset});
    debugLine(text, offset);
    const res = [];
    offset += struct.length;
    res.push('export interface');
    offset = parseEmpty(text, offset, res);
    let name: string;
    [name, offset] = parseName(text, offset);
    registerStruct(name);
    res.push(' ', name, '{');
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        console.debug('parsing struct fields...');
        debugLine(text, offset);
        offset = parseEmpty(text, offset, res);
        console.debug('after empty');
        debugLine(text, offset);
        if (text[offset] === '}') {
            break;
        }
        let typeName: TypeName;
        [typeName, offset] = parseTypeName(text, offset, res);
        res.push(typeName.name, ':', typeName.type, ';');
    }
    res.push('}');
    offset = skipOne(text, offset, '}', res);
    offset = skipOne(text, offset, ';', res);
    return [res, offset];
}

export function parseException(text: string, offset: number): [iolist, number] {
    console.debug('parseException', {offset});
    debugLine(text, offset);
    const res = [];
    offset += exception.length;
    res.push('export class');
    offset = parseEmpty(text, offset, res);
    let name: string;
    [name, offset] = parseName(text, offset);
    registerStruct(name);
    res.push(' ', name, ' extends Error{');
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        console.debug('parsing struct fields...');
        debugLine(text, offset);
        offset = parseEmpty(text, offset, res);
        console.debug('after empty');
        debugLine(text, offset);
        if (text[offset] === '}') {
            break;
        }
        let typeName: TypeName;
        [typeName, offset] = parseTypeName(text, offset, res);
        res.push(typeName.name, ':', typeName.type, ';');
    }
    res.push('}');
    offset = skipOne(text, offset, '}', res);
    offset = skipOne(text, offset, ';', res);
    return [res, offset];
}

export async function parseIfNDef(text: string, offset: number, selfFilename: string): Promise<[iolist, number]> {
    console.debug('parseIfNDef', {offset});
    debugLine(text, offset);
    const res = [];
    offset += ifndef.length;
    let name: string;
    offset = parseSpace(text, offset);
    [name, offset] = parseName(text, offset);
    const ignore = !isNDef(name);
    offset = parseEmpty(text, offset, res);
    for (; ;) {
        console.debug('try to parse ifndef body...');
        debugLine(text, offset);
        offset = parseEmpty(text, offset, res);
        if (text.startsWith(endif, offset)) {
            break;
        }
        let sub: iolist;
        [sub, offset] = await parse(text, offset, selfFilename);
        if (!ignore) {
            res.push(sub);
        }
    }
    offset += endif.length;
    return [res, offset];
}

export function parseDefine(text: string, offset: number): [iolist, number] {
    console.debug('parseDefine', {offset});
    debugLine(text, offset);
    offset += define.length;
    offset = parseSpace(text, offset);
    let name: string;
    [name, offset] = parseName(text, offset);
    registerDefine(name);
    return [[], offset];
}

export async function parseInclude(text: string, offset: number, selfFilename: string): Promise<[iolist, number]> {
    console.debug('parseInclude', {offset});
    debugLine(text, offset);
    offset += include.length;
    const res = [];
    offset = parseSpace(text, offset);
    if (text[offset] !== '"') {
        // TODO support #include <file.idl>
        debugLine(text, offset);
        throw new Error('expect #include "file.idl"');
    }
    offset = skipOne(text, offset, '"', res);
    if (res.length != 0) {
        console.error({offset, res});
        throw new Error('unexpected text, comment?');
    }
    const start = offset;
    const end = text.indexOf('"', offset);
    let filename = text.substring(start, end);
    if (isNameChar(filename[0])) {
        // resolve relative path
        filename = getDir(selfFilename) + '/' + filename;
    }
    await transpileFile(filename);
    offset = end + 1;
    return [res, offset];
}

export function parseEnum(text: string, offset: number): [iolist, number] {
    const res = [];
    res.push('export enum');
    offset += enum_.length;
    let name: string;
    offset = parseEmpty(text, offset, res);
    [name, offset] = parseName(text, offset);
    registerEnum(name);
    res.push(' ', name, '{');
    offset = skipOne(text, offset, '{', res);
    let first = true;
    for (; ;) {
        console.debug('try to parse enum value...', {offset});
        debugLine(text, offset);
        offset = parseEmpty(text, offset, res);
        if (text[offset] === '}') {
            break;
        }
        if (first) {
            first = false;
        } else {
            res.push(',');
            offset = skipOne(text, offset, ',', res);
            offset = parseEmpty(text, offset, res);
        }
        [name, offset] = parseName(text, offset);
        res.push(name);
    }
    res.push('}');
    offset = skipOne(text, offset, '}', res);
    offset = skipOne(text, offset, ';', res);
    return [res, offset];
}

function startsWith(pattern: string, text: string, offset: number): boolean {
    return text.startsWith(pattern, offset) && !isNameChar(text[offset + pattern.length]);
}

export async function parse(text: string, offset = 0, selfFilename: string): Promise<[iolist, number]> {
    console.debug('parse', {offset});
    debugLine(text, offset);
    offset = parseSpace(text, offset);

    /* macro */
    if (startsWith(define, text, offset)) {
        return parseDefine(text, offset);
    }
    if (startsWith(ifndef, text, offset)) {
        return parseIfNDef(text, offset, selfFilename);
    }
    if (startsWith(include, text, offset)) {
        return parseInclude(text, offset, selfFilename);
    }

    /* code */
    if (startsWith(module, text, offset)) {
        return parseModule(text, offset, selfFilename);
    }
    if (startsWith(typedef, text, offset)) {
        return parseTypeDef(text, offset);
    }
    if (startsWith('//', text, offset)) {
        return parseComment(text, offset);
    }
    if (startsWith('/*', text, offset)) {
        return parseBlockComment(text, offset);
    }
    if (startsWith(struct, text, offset)) {
        return parseStruct(text, offset);
    }
    if (startsWith(exception, text, offset)) {
        return parseException(text, offset);
    }
    if (startsWith(enum_, text, offset)) {
        return parseEnum(text, offset);
    }

    /* unknown token */
    console.error({
        filename: selfFilename, offset, len: text.length
        , line: getLineNum(text, offset)
    });
    debugLine(text, offset);
    throw new Error('unexpected text');
}

export async function parseFile(filename: string): Promise<iolist> {
    const text = (await util.promisify(fs.readFile)(filename)).toString();
    const [tree, offset] = await parse(text, 0, filename);
    if (offset != text.length
        && !(offset + 1 === text.length && text[offset + 1] === undefined)) {
        console.error('not fully parsed', {
            filename, offset, length: text.length
            , char: text[offset]
            , next: text[offset + 1]
        });
    }
    return tree;
}
