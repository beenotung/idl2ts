export type one_or_more<T> = T | T[];
export type iolist = Array<one_or_more<string>>;

export function iolist_to_string(iolist: iolist, acc = ''): string {
    if (Array.isArray(iolist)) {
        iolist.forEach(c => {
            acc = iolist_to_string(c, acc);
        });
        return acc;
    } else {
        // is string
        return acc + iolist;
    }
}