class EncodingHex {
    // Converts a number to a 32-bit hex string
    public static To32BitHexString(number: number) {
        return Convert.ToString(number, 16).PadLeft(8, '0').ToUpper()
    }

    // Converts a hex string to an integer
    public static ToNumber(someHexString: string) {
        try {
            return Convert.ToInt32(someHexString, 16)
        } catch {
            return 0
        }
    }
}
