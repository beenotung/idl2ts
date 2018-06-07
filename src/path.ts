export function getDir(fullpath: string): string {
    const ss = fullpath.split('/');
    ss.pop();
    return ss.join('/');
}

export function idlToTsFilename(idlFilename: string, moduleName: string): string {
    const ss = idlFilename.split('/');
    const filename = ss.pop();
    const dir = ss.join('/');
    return dir + '/' + moduleName + '/' + filename.replace(/\.idl$/, '.ts');
}
