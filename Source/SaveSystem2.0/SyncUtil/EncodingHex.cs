using System;
using System.Globalization;

public static class EncodingHex
{
    // Converts a number to a 32-bit hex string
    public static string To32BitHexString(int number)
    {
        return Convert.ToString(number, 16).PadLeft(8, '0').ToUpper();
    }


    // Converts a hex string to an integer
    public static int ToNumber(string someHexString)
    {
        try
        {
            return Convert.ToInt32(someHexString, 16);
        }
        catch
        {
            return 0;
        }
    }

}
