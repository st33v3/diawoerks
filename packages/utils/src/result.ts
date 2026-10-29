
export interface Result<T, E> {
    map<U>(fn: (value: T) => U): Result<U, E>;
    tap(fn: (value: T) => void): Result<T, E>;
    mapError<F>(fn: (error: E) => F): Result<T, F>;
    recover(fn: (error: E) => T): Result<T, E>;
    recoverWith(fn: (error: E) => Result<T, E>): Result<T, E>;
    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
    fold<R1, R2>(onSuccess: (value: T) => R1, onFailure: (error: E) => R2): R1 | R2;
    isSuccess(): this is Result.Success<T>;
    isFailure(): this is Result.Failure<E>;
    get(): T;
    getOrElse<U>(defaultValue: U): T | U;
    getOr<U>(fn: (error: E) => U): T | U;
}

export namespace Result {


    export const resultTag = Symbol("result");

    export interface Success<T> extends Result<T, never> {
        readonly [resultTag]: true;
        value: T;
    }

    export interface Failure<E> extends Result<never, E> {
        readonly [resultTag]: false;
        error: E;
    }

    export function is(value: unknown): value is Result<unknown, unknown> {
        return typeof value === "object" && value !== null && resultTag in value;
    }

    export function attempt<T>(fn: () => T): Result<T, unknown> {
        try {
            return success(fn());
        } catch (error) {
            return failure(error);
        }
    }

    export function fromOption<T>(value: T |  null | undefined, msg?: string): Result<NonNullable<T>, Error> {
        if (value === null || value === undefined) {
            return failure(new Error("Value is null or undefined" + (msg ? ": " + msg : "")));
        }
        return success(value as NonNullable<T>);
    }

    export function attemptErr<T>(fn: () => T): Result<T, Error> {
        try {
            return success(fn());
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    const successPrototype: Omit<Success<unknown>, "value"> = {
        [resultTag]: true,
        map(fn) {
            return success(fn((this as Success<unknown>).value));
        },
        tap(fn) {
            fn((this as Success<unknown>).value);
            return this as Success<unknown>;
        },
        recover(fn) {
            return this as Success<unknown>;
        },
        recoverWith(fn) {
            return this as Success<unknown>;
        },
        mapError() {
            return this as Success<unknown>;
        },
        flatMap(fn) {
            return fn((this as Success<unknown>).value);
        },
        fold(onSuccess, onFailure) {
            return onSuccess((this as Success<unknown>).value);
        },
        isSuccess(): this is Success<unknown> {
            return true;
        },
        isFailure(): this is Failure<never> {
            return false;
        },
        get() {
            return (this as Success<unknown>).value;
        },
        getOrElse(defaultValue) {
            return (this as Success<unknown>).value;
        },
        getOr(fn) {
            return (this as Success<unknown>).value;
        }
    };

    const failurePrototype: Omit<Failure<unknown>, "error"> = {
        [resultTag]: false,
        map(fn) {
            return this as Failure<unknown>;
        },
        mapError(fn) {
            return failure(fn((this as Failure<unknown>).error));
        },
        tap(fn) {
           return this as Failure<unknown>;
        },
        recover(fn) {
            return success(fn((this as Failure<unknown>).error));
        },
        recoverWith(fn) {
            return fn((this as Failure<unknown>).error);
        },
        flatMap(fn) {
            return this as Failure<unknown>;
        },
        fold(onSuccess, onFailure) {
            return onFailure((this as Failure<unknown>).error);
        },
        isSuccess(): this is Success<never> {
            return false;
        },
        isFailure(): this is Failure<unknown> {
            return true;
        },
        get() {
            throw new Error("Result has no value:", {cause: (this as Failure<unknown>).error});
        },
        getOrElse(defaultValue) {
            return defaultValue;
        },
        getOr(fn) {
            return fn((this as Failure<unknown>).error);
        }
    };

    export function failure<E>(error: E): Failure<E> {
        return Object.setPrototypeOf({ error }, failurePrototype);
    }

    export function success<T>(value: T): Success<T> {
        return Object.setPrototypeOf({ value }, successPrototype);
    }

    type ResultArray<T> = T extends [] ? [] : T extends [Result<infer T, unknown>, ... infer R] ? [T, ...ResultArray<R>] : never;
    type ResultErrorArray<T> = T extends [] ? [] : T extends [Result<unknown, infer E>, ... infer R] ? [E, ...ResultErrorArray<R>] : never;

    export function all<T extends readonly Result<unknown, unknown>[] | []>(results: T): Result<ResultArray<T>, ResultErrorArray<T>[number]> {
        const values: unknown[] = [];
        for (const result of results) {
            if (is(result.isFailure())) {
                return result as never;
            }
            values.push((result as Success<never>).value);
        }
        return success(values) as never;
    }

    
    export function settle<T extends Result<unknown, unknown>[] | []>(results: T): Result<ResultArray<T>, (ResultErrorArray<T>[number])[]> {
        const values: unknown[] = [];
        const errors: unknown[] = [];
        for (const result of results) {
            if (result.isFailure()) {
                errors.push((result as Failure<never>).error);
            } else {
                values.push((result as Success<never>).value);
            }
        }
        return errors.length > 0 ? failure(errors) as never : success(values) as never;
    }

    //const z = all([success(1), success("as")]);

//     const r1: Result<number, string> = fail("error");
//     const r2: Result<string, number> = fail("error");

//     const settled = settle([r1, r2]);
}