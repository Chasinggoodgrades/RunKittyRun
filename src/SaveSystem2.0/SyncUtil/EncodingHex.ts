export class EncodingHex {
    // Converts a number to a 32-bit hex string
    public static To32BitHexString(number: number): string {
        return number.toString(16).padStart(8, '0').toUpperCase()
    }

    // Converts a hex string to an integer
    public static ToNumber(someHexString: string): number {
        try {
            return parseInt(someHexString, 16)
        } catch {
            return 0
        }
    }
}
