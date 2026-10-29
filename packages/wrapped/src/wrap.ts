import * as Immutable from "immutable";
import { isDataIntro, Result, type DataIntro } from "utils";
import { propertyBagBuilder, type PropertyBag, type PropertyDecl, type PropertyId } from "./bag";

export type AnyWrapped = WrappedStructure<any, any, any>;

interface Subscription {
    callback: () => void;
    unsubscribe: () => void;
}

export interface PropertyFactory {
    bag: PropertyBag;
    create<T>(decl: PropertyId<T>): Result<Property<T>, Error>;
}

export interface PropertyFactoryBuilder {
    add<T>(decl: PropertyDecl<T>, factory: (decl: PropertyDecl<T>) => Property<T>): PropertyFactoryBuilder;
    addFromBag<T>(id: PropertyId<T>, bag: PropertyBag, factory: (decl: PropertyDecl<T>) => Property<T>): PropertyFactoryBuilder;
    build(): PropertyFactory;
}

export function propertyFactoryBuilder(): PropertyFactoryBuilder {
    const ctors = new Map<PropertyId<unknown>, [PropertyDecl<unknown>, () => Property<unknown>]>();
    return {
        add<T>(decl: PropertyDecl<T>, ctor: (decl: PropertyDecl<T>) => Property<T>): PropertyFactoryBuilder {
            if (ctors.has(decl.key)) throw new Error(`Factory for id "${decl.key}" already exists`);
            ctors.set(decl.key, [decl, () => ctor(decl)]);
            return this;
        },
        addFromBag<T>(id: PropertyId<T>, bag: PropertyBag, ctor: (decl: PropertyDecl<T>) => Property<T>): PropertyFactoryBuilder {
            const decl = bag.get(id);
            if (!decl) throw new Error(`No declaration found for id "${id}"`);
            return this.add(decl, ctor);
        },
        build(): PropertyFactory {
            const bld = propertyBagBuilder();
            for (const [decl] of ctors.values()) bld.add(decl);
            const bag: PropertyBag = bld.build();
            return {
                bag,
                create<T>(decl: PropertyId<T>): Result<Property<T>, Error> {
                    return Result
                       .fromOption(ctors.get(decl), `No factory found for id "${decl}"`)
                       .flatMap(entry => Result.attemptErr(() => entry[1]() as Property<T>))
                }
            };
        }
    }
}

export const emptyPropertyFactory = propertyFactoryBuilder().build();

export abstract class Wrapped<V> {
    private value: V;
    private parent: AnyWrapped | null;
    private parentKey: PropertyKey | undefined;
    private subscriptions: Set<WeakRef<Subscription>> = new Set();
    private finReg = new FinalizationRegistry((held: WeakRef<Subscription>) => {
        this.subscriptions.delete(held);
    });
    private properties: Map<PropertyId<unknown>, Property<unknown>> = new Map();

    constructor(parent: AnyWrapped | null, key: PropertyKey | undefined, value: V, protected readonly props: PropertyFactory = emptyPropertyFactory) {
        this.value = value;
        this.parent = parent;
        this.parentKey = key;
    }

    public bag(): PropertyBag {
        return this.props.bag;
    }
    /**
     * Subscribes to changes of the wrapped value. The registration is automatically managed and will be cleaned up when the subscription is no longer needed.
     * Once the subscription is garbage collected, it will be automatically removed from this instance's subscription list. Therefore clients MUST retain a reference
     * to the returned Subscription if they want to keep receiving updates.
     * @param callback the callback to be called when wrapped value changes
     * @returns Subscription instance that allow later cancellation
     */
    subscribe(callback: () => void): Subscription {
        let subscription: Subscription;
        const subscriptionRef: WeakRef<Subscription> = new WeakRef(subscription = {
            callback,
            unsubscribe: () => this.subscriptions.delete(subscriptionRef)
        });
        this.subscriptions.add(subscriptionRef);
        this.finReg.register(subscription, subscriptionRef);
        return subscription;
    }

    protected notifySubscribers(): void {
        for (const subscriptionRef of this.subscriptions) {
            const subscription = subscriptionRef.deref();
            if (subscription) {
                Wrapped.notificationCount++;
                subscription.callback();
            }
        }
    }

    get(): V {
        return this.value;
    }

    /**
     * Called when value is actually changing - subclasses override this method to react to the change
     * @param newValue new value to be set to the this instance
     */
    protected changing(newValue: V): void {
            this.value = newValue;
    }

    set(value: V): void {
        if (!Immutable.is(this.value, value)) {
            if (Wrapped.setting === 0) {
                Wrapped.notificationCount = 0;
                Wrapped.setStart = performance.now();
            }
            Wrapped.setting++;
            try {
                this.changing(value);
                if (this.parent && this.parentKey !== undefined) {
                    this.parent.setSubvalue(this.parentKey, this.value as never);
                }
                this.notifySubscribers();
            } finally {
                Wrapped.setting--;
                if (Wrapped.setting === 0) {
                    const duration = performance.now() - Wrapped.setStart;
                    console.log(`Setting duration: ${duration}ms, notifications: ${Wrapped.notificationCount}`);
                }
            }
        }
    }

    update(fn: (orig: V) => V): void {
        this.set(fn(this.get()));
    }

    /**
     * Called when parent changes to either signal that new value is not supported by this instance or to update the value and notify subscribers
     * @returns true if the value was successfully revalidated, false otherwise
     * 
     */
    revalidate(): boolean {
        if (!this.parent || this.parentKey === undefined) {
            return false;
        }
        const newValue = this.parent.subvalue(this.parentKey as never);
        if (!this.accepts(newValue)) {
            return false;
        }
        this.set(newValue);
        return true;
    }

    accepts(value: unknown): boolean {
        return true;
    }

    property<T>(id: PropertyId<T>): Result<Property<T>, Error> {
        return Result
            .fromOption(this.properties.get(id) as Property<T>)
            .recoverWith(() => this.props.create(id).tap(prop => this.properties.set(id, prop)));
    }

    private static notificationCount = 0;
    private static setting = 0;
    private static setStart = 0;

}

export class WrappedValue<V> extends Wrapped<V> {
}

/**
 * 
 * @template V The type of the wrapped value (the type is required to be immutable, so any modification creates new instance)
 * @template I The type of the index used to access elements within the wrapped value (must be a key of V)
 */
export abstract class WrappedStructure<V, I extends PropertyKey, TM extends Record<I, unknown>> extends Wrapped<V> {
    private children = new Map<I, Wrapped<unknown>>();

    constructor(parent: AnyWrapped | null, key: PropertyKey | undefined, value: V, props: PropertyFactory = emptyPropertyFactory) {
        super(parent, key, value, props);
    }

    protected override changing(value: V): void {
        super.changing(value);
        for (const [key, child] of this.children.entries()) {
            if (!child.revalidate()) this.children.delete(key);
        }
    }

    abstract subvalue<K extends I>(key: K): TM[K];
    abstract setSubvalue<K extends I>(key: K, value: TM[K]): void;

    protected cache<K extends I, W extends Wrapped<unknown>>(key: K, create: (value: TM[K]) => W): W {
        let w = this.children.get(key);
        const value = this.subvalue(key);
        if (!w || !w.accepts(value)) {
            this.children.set(key, w = create(value));
        }
        return w as W;
    }

    descent<K extends I>(key: K): WrappedValue<TM[K]> {
        return this.cache(key, (sub) => new WrappedValue(this, key, sub));
    }

    descentData<K extends I>(key: K): [TM[K]] extends [infer D extends DataIntro<infer TP>] ? WrappedData<D> : never {
        return this.cache(key, (sub) => {
            if (!isDataIntro(sub)) {
                throw new Error("Not a DataIntro at key " + key.toString());
            }
            return new WrappedData(this, key, sub) as never;
        });
    }

    descentList<K extends I>(key: K): TM[K] extends Immutable.List<infer U> ? WrappedList<U> : never {
        return this.cache(key, (sub) => {
            if (!Immutable.List.isList(sub)) {
                throw new Error("Not a list at key " + key.toString());
            }
            return new WrappedList(this, key, sub) as never;
        });
    }

    descentMap<K extends I>(key: K): TM[K] extends Immutable.Map<infer K extends PropertyKey, infer V> ? WrappedMap<K, V> : never {
        return this.cache(key, (sub) => {
            if (!Immutable.Map.isMap(sub)) {
                throw new Error("Not a map at key " + key.toString());
            }
            return new WrappedMap(this, key, sub as never) as never;
        });
    }

    descentContract<K extends I, R>(key: K, factory: (parent: AnyWrapped, key: K, x: TM[K]) => Result<R, Error>): Result<R, Error> {
        const value = this.subvalue(key);
        return factory(this, key, value);
    }
}

export const UnsetProperty = Symbol("UnsetProperty");

export class Property<T> extends Wrapped<T | typeof UnsetProperty> {
    public constructor(value: T, public readonly decl: PropertyDecl<T>) {
        super(null, undefined, value, emptyPropertyFactory);
    }

    unset(): void {
        this.set(UnsetProperty);
    }

    peek(): T | typeof UnsetProperty {
        return super.get();
    }

    override get(): T {
        const value = super.get();
        if (value === UnsetProperty) {
            throw new Error("Property is unset");
        }
        return value;
    }
}

export class PropertyWithDefault<T> extends Property<T> {
    private subscription: Subscription;

    constructor(value: T | typeof UnsetProperty, decl: PropertyDecl<T>, public readonly defaultValue: Wrapped<T>) {
        super(value as T, decl);
        this.subscription = this.defaultValue.subscribe(() => this.notifySubscribers());
    }

    override get(): T {
        const value = super.peek();
        if (value === UnsetProperty) {
            return this.defaultValue.get();
        }
        return value;
    }
}

type DOTM<T> = T extends DataIntro<infer TP> ? TP : never;

export class WrappedData<V extends DataIntro<any>> extends WrappedStructure<V, keyof DOTM<V> & string, DOTM<V>> {
    subvalue<K extends keyof DOTM<V> & string>(key: K): DOTM<V>[K] {
        return this.get().get(key);
    }

    setSubvalue<K extends keyof DOTM<V> & string>(key: K, value: DOTM<V>[K]): void {
        const obj = this.get();
        this.set(obj.set(key as never, value as never));
    }
}

export class WrappedList<E> extends WrappedStructure<Immutable.List<E>, number, Record<number, E>> {
    subvalue(key: number): E {
        const v = this.get().get(key);
        if (v === undefined) {
            throw new Error("No value at index " + key);
        }
        return v;
    }
    setSubvalue(key: number, value: E): void {
        const obj = this.get();
        (obj as Immutable.List<E>).set(key, value);
        this.set(obj);
    }

    has(key: number): boolean {
        return this.get().has(key);
    }
}

export class WrappedMap<K extends PropertyKey, V> extends WrappedStructure<Map<K, V>, K, Record<K, V>> {
    subvalue(key: K): V {
        const v = this.get().get(key);
        if (v === undefined) {
            throw new Error("No value at key " + key.toString());
        }
        return v;
    }

    setSubvalue(key: K, value: V): void {
        const obj = this.get();
        (obj as Map<K, V>).set(key, value);
        this.set(obj);
    }

    has(key: K): boolean {
        return this.get().has(key);
    }
}

// class C extends DataClass({ c: "" }) {}
// class D extends C {}

// class A extends DataClass({
//     a: "",
//     b: 0,
//     c: new C(),
//     d: new D(),
//     l: Immutable.List<number>(),
// }) {}

// class XW<V extends DataIntro<any>> extends WrappedData<V> {
// }

// const a: A = fail();

// function fact<P extends C>(p: P): Result<XW<P>, Error> {
//     throw new Error("Not implemented");
// }

// const bag = {} as PropertyBag
// const w = new WrappedData(null, undefined, a, bag);
// const wa = w.descent("a");
// const wl = w.descentList("l");
// const wl0 = wl.descent(0);

// const wc = w.descentContract("c", fact).get();
// const wd = w.descentContract("d", fact).get();