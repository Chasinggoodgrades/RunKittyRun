public static class OldSavesHelper
{
    public static string charset { get; } = "!$%&'()*+,-.0123456789:;=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}`";
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
        return -1;
    }

    public static int ModuloInteger(int x, int n) => ((x % n) + n) % n;

    public static int CharToInt(char c)
    {
        int i = 0;
        while (i < charset.Length && c != charset[i])
        {
            i++;
        }
        return i;
    }

    public static int[] AbilityList = {
        1097690227, // Amls
		1098018659, // Aroc
		1097689443, // Amic
		1097689452, // Amil
		1097034854, // Aclf
		1097035111, // Acmg
		1097098598, // Adef
		1097099635, // Adis
		1097228916, // Afbt
		1097228907, // Afbk
    };
}
