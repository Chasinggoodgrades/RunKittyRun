export abstract class IDisposable {
    public abstract dispose(): void
}

export type Action<T = any> = (...args: T[]) => void
