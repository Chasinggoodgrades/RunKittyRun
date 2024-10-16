using System;
using System.Runtime.InteropServices;

public static class OldSavesHelper
{
    private static string PlayerCharSet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    public static int Player_CharToInt(char c)
    {
        for (int i = 0; i < PlayerCharSet.Length; i++)
        {
            if (c == PlayerCharSet[i])
            {
                return i;
            }
        }
        return -1; // Return -1 if character not found
    }
    public static int PlayerCharSetLength => PlayerCharSet.Length;
    public static int ModuloInteger(int x, int n) => ((x % n) + n) % n;

    public static int CharToInt(char c)
    {
        int i = 0;
        while (i < Savecode.charset.Length && c != Savecode.charset[i])
        {
            i++;
        }
        return i;
    }

}

