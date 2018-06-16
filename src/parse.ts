import {debugLine, errorLine} from "./debug";
import {iolist, writeToFile} from "./io";
import {registerEnum, registerException, registerStruct, registerType, toJsType} from "./type";
import {isNDef, registerDefine} from "./macro";
import * as util from "util";
import * as fs from "fs";
import {transpileFile} from "./transpiler";
import {getDir} from "./path";
import {getLineNum} from "./string";
import {compare} from "./comapre";

export const ifndef = '#ifndef';
export const endif = '#endif';
export const define = '#define';
export const include = '#include';

export const module = 'module';
export const typedef = 'typedef';
export const struct = 'struct';
export const exception = 'exception';
export const enum_ = 'enum';
export const interface_ = 'interface';
export const raises = 'raises';
export const in_ = 'in';
export const out = 'out';
export const inout = 'inout';

export function skipAll(text: string, offset: number, char: string): number {
    for (; text[offset] === char && offset < text.length; offset++) {
    }
    return offset;
}

export function skipOne(text: string, offset: number, char: string, res: iolist): number {
    offset = parseEmpty(text, offset, res);
    if (text[offset] !== char) {
        errorLine(text, offset);
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
    const first = text[offset];
    if (!(first === '_' || isAlpha(first))) {
        errorLine(text, offset);
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

export interface Context {
    idlFilename: string
    preRes: iolist
}

export function parseTypeName(text: string, offset: number, res: iolist, ctx: Context): [TypeName, number] {
    const stopCharIdx_list = [',', ';', ')']
        .map(char => ({char, idx: text.indexOf(char, offset)}))
        .filter(x => x.idx !== -1)
    ;
    stopCharIdx_list.sort((a, b) => compare(a.idx, b.idx));
    const stopWord = stopCharIdx_list[0].char;
    const end = text.indexOf(stopWord, offset);
    const type_name = text.substring(offset, end);
    const ss = type_name.split(' ');
    const name = ss.pop();
    registerType(name, ctx.idlFilename);
    let type = ss.join(' ');
    try {
        type = toJsType(type, ctx.idlFilename, ctx.preRes);
    } catch (e) {
        console.error(`failed get js type of '${type}'`);
        errorLine(text, offset);
        throw e;
    }
    offset = end;
    // offset = skipOne(text, offset, stopWord, res);
    return [{type, name}, offset];
}

export function parseTypeDef(text: string, offset: number, ctx: Context): [iolist, number] {
    const res = [];
    offset += typedef.length;
    res.push('export type');
    offset = parseEmpty(text, offset, res);
    let typeName: TypeName;
    [typeName, offset] = parseTypeName(text, offset, res, ctx);
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

export function parseStruct(text: string, offset: number, ctx: Context): [iolist, number] {
    const res = [];
    offset += struct.length;
    res.push('export interface');
    offset = parseEmpty(text, offset, res);
    let name: string;
    [name, offset] = parseName(text, offset);
    registerStruct(name, ctx.idlFilename);
    res.push(' ', name, '{');
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        offset = parseEmpty(text, offset, res);
        if (text[offset] === '}') {
            break;
        }
        let typeName: TypeName;
        [typeName, offset] = parseTypeName(text, offset, res, ctx);
        res.push(typeName.name, ':', typeName.type, ';');
    }
    res.push('}');
    offset = skipOne(text, offset, '}', res);
    offset = skipOne(text, offset, ';', res);
    return [res, offset];
}

export function parseException(text: string, offset: number, ctx: Context): [iolist, number] {
    const res = [];
    offset += exception.length;
    res.push('export class');
    offset = parseEmpty(text, offset, res);
    let name: string;
    [name, offset] = parseName(text, offset);
    registerException(name, ctx.idlFilename);
    res.push(' ', name, ' extends Error{');
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        offset = parseEmpty(text, offset, res);
        if (text[offset] === '}') {
            break;
        }
        let typeName: TypeName;
        [typeName, offset] = parseTypeName(text, offset, res, ctx);
        res.push(typeName.name, ':', typeName.type, ';');
    }
    res.push('}');
    offset = skipOne(text, offset, '}', res);
    offset = skipOne(text, offset, ';', res);
    return [res, offset];
}

export async function parseIfNDef(text: string, offset: number, selfFilename: string): Promise<[iolist, number]> {
    const res = [];
    offset += ifndef.length;
    let name: string;
    offset = parseSpace(text, offset);
    [name, offset] = parseName(text, offset);
    const ignore = !isNDef(name);
    offset = parseEmpty(text, offset, res);
    for (; ;) {
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
    offset += define.length;
    offset = parseSpace(text, offset);
    let name: string;
    [name, offset] = parseName(text, offset);
    registerDefine(name);
    return [[], offset];
}

export async function parseInclude(text: string, offset: number, selfFilename: string): Promise<[iolist, number]> {
    offset += include.length;
    const res = [];
    offset = parseSpace(text, offset);
    if (text[offset] !== '"') {
        // TODO support #include <file.idl>
        errorLine(text, offset);
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

export function parseEnum(text: string, offset: number, ctx: Context): [iolist, number] {
    const res = [];
    res.push('export enum');
    offset += enum_.length;
    let name: string;
    offset = parseEmpty(text, offset, res);
    [name, offset] = parseName(text, offset);
    registerEnum(name, ctx.idlFilename);
    res.push(' ', name, '{');
    offset = skipOne(text, offset, '{', res);
    let first = true;
    for (; ;) {
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

// TODO design Box for out and inout
export function parseMethodArgument(text: string, offset: number, ctx: Context): [iolist, number] {
    const res = [];
    const direction: string = text.substring(offset, text.indexOf(' ', offset));
    if (!(
            direction === 'in'
            || direction === 'out'
            || direction === 'inout'
        )) {
        errorLine(text, offset);
        throw new Error(`invalid direction '${direction}'`);
    }
    offset += direction.length;
    offset = parseEmpty(text, offset, res);
    let typeName: TypeName;
    [typeName, offset] = parseTypeName(text, offset, res, ctx);
    res.push(`${typeName.name}:${typeName.type}`);
    return [res, offset];
}

export function parseRaisesException(text: string, offset: number): [iolist, number] {
    const res = [];
    offset = skipOne(text, offset, raises, res);
    offset = skipOne(text, offset, '(', res);
    let first = true;
    for (; ;) {
        offset = parseEmpty(text, offset, res);
        if (text[offset] === ')') {
            break;
        }
        if (first) {
            first = false;
        } else {
            res.push(',');
            offset = skipOne(text, offset, ',', res);
            offset = parseEmpty(text, offset, res);
        }
        let name: string;
        [name, offset] = parseName(text, offset);
        res.push(`/** @throws ${name}} */`);
    }
    offset = skipOne(text, offset, ')', res);
    return [res, offset];
}

export function parseMethod(text: string, offset: number, ctx: Context): [iolist, number] {
    const res = [];

    let returnType: string;
    [returnType, offset] = parseName(text, offset);
    offset = parseEmpty(text, offset, res);

    let methodName: string;
    [methodName, offset] = parseName(text, offset);
    offset = parseEmpty(text, offset, res);

    res.push('abstract ', methodName);

    /* parse arguments */
    let first = true;
    offset = skipOne(text, offset, '(', res);
    res.push('(');
    for (; ;) {
        offset = parseEmpty(text, offset, res);
        if (text[offset] === ')') {
            break;
        }
        if (first) {
            first = false;
        } else {
            res.push(',');
            offset = skipOne(text, offset, ',', res);
            offset = parseEmpty(text, offset, res);
        }
        let arg: iolist;
        [arg, offset] = parseMethodArgument(text, offset, ctx);
        console.debug({arg, c: text[offset]});
        debugLine(text, offset);
        res.push(arg);
    }
    offset = skipOne(text, offset, ')', res);
    res.push('):', returnType, ';');

    /* parse optional exceptions */
    offset = parseEmpty(text, offset, res);
    const exceptions: iolist = [];
    if (text.startsWith(raises, offset)) {
        let exceptions: iolist;
        [exceptions, offset] = parseRaisesException(text, offset);
    }

    return [[exceptions, res], offset];
}

export async function parseInterface(text: string, offset: number, ctx: Context): Promise<[iolist, number]> {
    const res = [];
    offset += interface_.length;
    res.push('export abstract class');
    offset = parseEmpty(text, offset, res);
    let name: string;
    [name, offset] = parseName(text, offset);
    res.push(' ', name, '{');
    offset = parseEmpty(text, offset, res);
    offset = skipOne(text, offset, '{', res);
    for (; ;) {
        offset = parseEmpty(text, offset, res);
        if (text.startsWith('}', offset)) {
            break;
        }
        let method: iolist;
        [method, offset] = parseMethod(text, offset, ctx);
        res.push(method);
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
    offset = parseSpace(text, offset);
    const ctx = {
        idlFilename: selfFilename
        , preRes: []
    };
    const defer = (res): Promise<[iolist, number]> => Promise.resolve(res).then(([res, offset]) => {
        return [[ctx.preRes, res], offset]as [iolist, number];
    });

    /* macro */
    if (startsWith(define, text, offset)) {
        return defer(parseDefine(text, offset));
    }
    if (startsWith(ifndef, text, offset)) {
        return defer(parseIfNDef(text, offset, selfFilename));
    }
    if (startsWith(include, text, offset)) {
        return defer(parseInclude(text, offset, selfFilename));
    }

    /* code */
    if (startsWith(module, text, offset)) {
        return defer(parseModule(text, offset, selfFilename));
    }
    if (startsWith(typedef, text, offset)) {
        return defer(parseTypeDef(text, offset, ctx));
    }
    if (startsWith('//', text, offset)) {
        return defer(parseComment(text, offset));
    }
    if (startsWith('/*', text, offset)) {
        return defer(parseBlockComment(text, offset));
    }
    if (startsWith(struct, text, offset)) {
        return defer(parseStruct(text, offset, ctx));
    }
    if (startsWith(exception, text, offset)) {
        return defer(parseException(text, offset, ctx));
    }
    if (startsWith(enum_, text, offset)) {
        return defer(parseEnum(text, offset, ctx));
    }
    if (startsWith(interface_, text, offset)) {
        return defer(parseInterface(text, offset, ctx));
    }

    /* unknown token */
    console.error({
        filename: selfFilename, offset, len: text.length
        , line: getLineNum(text, offset)
    });
    errorLine(text, offset);
    throw new Error('unexpected text');
}

export async function parseFile(filename: string): Promise<iolist> {
    const text = (await util.promisify(fs.readFile)(filename)).toString();
    const topTrees = [];
    let offset = 0;
    for (; ;) {
        let tree: iolist;
        [tree, offset] = await parse(text, offset, filename);
        topTrees.push(tree);
        if (offset != text.length
            && !(offset + 1 === text.length && text[offset + 1] === undefined)) {
            console.log('continue to parse', {
                filename, offset, length: text.length
                , char: text[offset]
                , next: text[offset + 1]
            });
            continue;
        }
        break;
    }
    return topTrees;
}
