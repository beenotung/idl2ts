const unsigned = 'unsigned';
const customTypes = new Set<string>();
const customStructs = new Set<string>();
const customEnums = new Set<string>();

export function registerType(name: string) {
    customTypes.add(name);
}

export function registerStruct(name: string) {
    customStructs.add(name);
}

export function registerEnum(name: string) {
    customEnums.add(name);
}

export function toJsType(type: string) {
    if (customTypes.has(type)
        || customStructs.has(type)
        || customEnums.has(type)
    ) {
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
        return `Array<${toJsType(type)}>`;
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
