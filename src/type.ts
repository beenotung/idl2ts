import {iolist} from "./io";

const unsigned = 'unsigned';

/* store the filename */
const customTypes = new Map<string, string>();
const customStructs = new Map<string, string>();
const customEnums = new Map<string, string>();
const customException = new Map<string, string>();

export function registerType(name: string, filename: string) {
    customTypes.set(name, filename);
}

export function registerStruct(name: string, filename: string) {
    customStructs.set(name, filename);
}

export function registerEnum(name: string, filename: string) {
    customEnums.set(name, filename);
}

export function registerException(name: string, filename: string) {
    customException.set(name, filename);
}

// TODO explicitly specify the type, e.g. the client may expect an exception, not enum
export function toJsType(type: string, selfFilename: string, preRes: iolist): string {
    if (customTypes.has(type)
        || customStructs.has(type)
        || customEnums.has(type)
        || customException.has(type)
    ) {
        const sourceFilename =
            customTypes.get(type)
            || customStructs.get(type)
            || customEnums.get(type)
            || customException.get(type)
            || selfFilename;
        if (sourceFilename != selfFilename) {
            // const relativeFilename = toRelativeFilename(sourceFilename, selfFilename);
            // const moduleName = relativeFilename.replace(/\.ts$/, ''); // FIXME
            // preRes.push(`import{${type}}from"${moduleName}";`);
        }
        return type;
    }
    type = type.split(' ')
        .filter(s => s)
        .join(' ');
    if (type === '') {
        throw new Error('type should not be empty');
    }
    if (type.startsWith('string<') && type.endsWith('>')) {
        return 'string';
    }
    if (type.startsWith('sequence<') && type.endsWith('>')) {
        type = type.substring('sequence<'.length, type.length - 1);
        return `Array<${toJsType(type, selfFilename, preRes)}>`;
    }
    switch (type) {
        case 'octet':
            return 'number';
        case 'sequence<octet>':
            return 'Buffer'; // TODO to confirm the type
        case 'string':
            return 'string';
        case 'any':
            return 'any';
    }
    if (type.startsWith(unsigned + ' ')) {
        type = type.substring(unsigned.length + 1);
    }
    switch (type) {
        case 'short':
        case 'long':
        case 'long long':
            return 'number';
    }
    throw new Error(`unknown type: '${type}'`);
}
