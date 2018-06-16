import {ParseItem, Parser} from "./common";
import {formatToken, Token} from "./tokenizer";

export class TokenItem extends ParseItem {
    constructor(public token: Token) {
        super();
    }

    toJsCode(): string {
        throw new Error('Non-Support Operation');
    }
}

export class TokenParser extends Parser<TokenItem> {
    constructor(public token: Token) {
        super();
    }

    parse(tokens: Token[], offset: number): [TokenItem, number] {
        if (offset >= tokens.length) {
            throw new Error(`expect token ${formatToken(this.token)} but no more tokens`);
        }
        const c = tokens[0];
        if (c.type !== this.token.type) {
            throw new Error(`expect token ${formatToken(this.token)} but see ${formatToken(c)}`);
        }
        // TODO
        if (!text.startsWith(this.token, offset)) {
            throw new Error(`expect '${this.token}' but see '${text[offset]}'`);
        }
        const res = new TokenItem(this.token);
        return [res, offset];
    }
}
