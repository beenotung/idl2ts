const define_set = new Set<string>();

export function define(name: string) {
    if (hasDefine(name)) {
        throw new Error(`'${name}' is defined already`);
    }
    define_set.add(name);
}

export function hasDefine(name: string) {
    return define_set.has(name);
}
