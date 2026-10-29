import { useSyncExternalStore } from "react";
import type { Property, PropertyId, Wrapped } from "wrapped";

function subscribe(w: Wrapped<unknown>): (cb: () => void) => () => void {
    return (cb) => {
        const subscription = w.subscribe(cb);
        return () => subscription.unsubscribe(); //returned cancellation function must close over the subscription to prevent it from being garbage collected
    }
}

export function useWrapped<T, W extends Wrapped<T>>(w: W): W {
    useSyncExternalStore(subscribe(w), () => w.get());
    return w;
}

export function useWrappedProperty<T, W extends Wrapped<unknown>>(w: W, id: PropertyId<T>): Property<T> {
    const prop = w.property(id).get(); // access the property to ensure it exists and is tracked by the subscription
    useSyncExternalStore(subscribe(prop), () => prop.get());
    return prop;
}