import {ParseItem, Parser} from "./common";
import {Token} from "./tokenizer";

export class Module extends ParseItem {
    toJsCode(): string {
        return undefined;
    }
}

export class ModuleParser extends Parser<Module> {
    parse(tokens: Token[], offset: number): [Module, number] {
        return undefined;
    }
}
