export function toJsType(type: string) {
    type = type.split(' ')
        .filter(s => s)
        .join(' ');
    if (type.startsWith('string<') && type.endsWith('>')) {
        return 'string';
    }
    switch (type) {
        case 'unsigned long long':
            return 'number';
        case 'sequence<octet>':
            return 'Buffer'; // TODO to confirm the type
        case 'string':
            return 'string';
    }
    throw new Error('unknown type: ' + type);
}