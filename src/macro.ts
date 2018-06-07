const macroDefs = new Set<string>();

export function isDef(name: string) {
    return macroDefs.has(name);
}

export function isNDef(name: string) {
    return !macroDefs.has(name);
}

export function registerDefine(name: string) {
    macroDefs.add(name);
}
