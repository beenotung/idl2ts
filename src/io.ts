export type one_or_more<T> = T | T[];
export type iolist = Array<one_or_more<string>>;

export function iolist_to_string(iolist: iolist, acc = ''): string {
    iolist.forEach(c => {
        if (Array.isArray(c)) {
            acc = iolist_to_string(c, acc);
        } else {
            acc += c;
        }
    });
    return acc;
}
