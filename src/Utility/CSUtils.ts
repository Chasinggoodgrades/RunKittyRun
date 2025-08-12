export abstract class IDisposable {
    public abstract Dispose(): void
}

export type Action = () => void
