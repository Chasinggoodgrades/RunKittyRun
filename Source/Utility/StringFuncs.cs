using System;
using System.Collections.Generic;

public static class StringFuncs
{
    public static List<string> UnpackStringNewlines(string value)
    {
        List<string> allLines = new List<string>();
        string[] lines = value.Split('\n');

        foreach (var line in lines)
        {
            string trimmedLine = line.Trim();
            if (!string.IsNullOrEmpty(trimmedLine))
            {
                allLines.Add(trimmedLine);
            }
        }

        return allLines;
    }
}
