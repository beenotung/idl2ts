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

export function toRelativeFilename(sourceFilename: string, targetFilename: string): string {
    const src_ps = sourceFilename.split('/');
    const target_ps = targetFilename.split('/');
    const res_ps = [];

    src_ps.pop();
    res_ps.push(target_ps.pop());
    // TODO cater other cases
    if (target_ps.length === 0 && src_ps.length > 0) {
        res_ps.push(src_ps.pop());
    }
    res_ps.reverse();
    return res_ps.join('/');
}
