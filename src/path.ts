export function getDir(fullpath: string): string {
const ss =    fullpath.split('/');
ss.pop();
return ss.join('/');
}
