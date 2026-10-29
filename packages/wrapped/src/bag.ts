import { Result } from "../../utils/src/result";


export type PropertyId<T> = string & { __type: T, __tag: 'property' };

const propertyIdCache = new Set<string>();
    
export function propertyId<T>(name: string): PropertyId<T> {
    if (propertyIdCache.has(name)) throw new Error(`PropertyId for name "${name}" already exists`);
    const id = name as PropertyId<T>;
    propertyIdCache.add(name);
    return id;
}

export abstract class PropertyTypeMirror<T> {
    constructor(
        public readonly nameTemplate: string,
        public readonly enumerable: boolean, 
        public readonly typeTag: string | undefined, 
        public readonly primitive: "number" | "string" | "boolean" | "symbol") {
        }
    
    public abstract assert(value: unknown): Result<T, string>;
    
}

export interface PropertyDecl<T> {
    key: PropertyId<T>;
    type: PropertyTypeMirror<T>;
    name: string;
}

export function propertyDecl<T>(key: PropertyId<T>, type: PropertyTypeMirror<T>, name: string): PropertyDecl<T> {
    return { key, type, name };
}

export type PropertyIdType<K extends PropertyId<unknown>> = K extends PropertyId<infer T> ? T : never;

export interface PropertyBag {
    get<T>(key: PropertyId<T>): PropertyDecl<T>;
    properties(): Iterable<PropertyDecl<unknown>>;
}

export const emptyPropertyBag: PropertyBag = {
    get<T>(key: PropertyId<T>): PropertyDecl<T> {
        throw new Error(`No declaration found for key ${key}`);
    },
    properties(): Iterable<PropertyDecl<unknown>> {
        return [];
    }
};

export interface PropertyBagBuilder {
    add<T>(decl: PropertyDecl<T>): PropertyBagBuilder;
    build(): PropertyBag;
}

export function propertyBagBuilder(): PropertyBagBuilder {
    const decls = new Map<string, PropertyDecl<unknown>>();
    return {
        add<T>(decl: PropertyDecl<T>): PropertyBagBuilder {
            if (decls.has(decl.key as string)) throw new Error(`PropertyDecl for key "${decl.key}" already exists`);
            decls.set(decl.key as string, decl);
            return this;
        },
        build(): PropertyBag {
            return {
                get<T>(key: PropertyId<T>): PropertyDecl<T> {
                    const decl = decls.get(key as string);
                    if (!decl) return emptyPropertyBag.get(key);
                    return decl as PropertyDecl<T>;
                },
                properties(): Iterable<PropertyDecl<unknown>> {
                    return decls.values();
                }
            };
        }
    };
}
