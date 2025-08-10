// declare function encode<T>(v: T): string
// declare function decode<T>(v: string): T

declare function json(): { encode<T>(v: T): string; decode<T>(v: string): T | undefined }
