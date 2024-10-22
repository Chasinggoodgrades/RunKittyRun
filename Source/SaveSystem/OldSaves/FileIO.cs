using System.Collections.Generic;
using System;
using static WCSharp.Api.Common;

public class FileIO
{
    private static int Counter = 0;
    private static Dictionary<int, FileIO> List = new Dictionary<int, FileIO>();
    private string filename;
    private string buffer;
    private const int JASS_MAX_ARRAY_SIZE = 8192;
    private static int AbilityCount = OldSavesHelper.AbilityList.Length;

    public static string Read(string filename)
    {
        return FileIO.Open(filename).ReadEx(true);
    }

    public static FileIO Open(string filename)
    {
        FileIO fileIO;
        if (!List.TryGetValue(0, out fileIO) || fileIO == null)
        {
            fileIO = new FileIO { filename = filename };
            Counter++;
        }
        else
        {
            List[0] = null;
        }

        if (Counter >= JASS_MAX_ARRAY_SIZE)
        {
            Console.WriteLine($"FileIO({filename}) WARNING: Maximum instance limit {JASS_MAX_ARRAY_SIZE} reached.");
        }

        fileIO.buffer = null;
        return fileIO;
    }

    public string ReadEx(bool close)
    {
        string output = ReadPreload();
        string buf = buffer;

        if (output == null)
        {
            return buf;
        }

        if (buf != null)
        {
            output = output + buf;
        }

        return output;
    }

    public string ReadPreload()
    {
        int i = 0;
        int lev = 0;
        string[] original = new string[AbilityCount];
        string chunk = "";
        string output = "";

        // Get original tooltips
        for (i = 0; i < AbilityCount; i++)
        {
            original[i] = BlzGetAbilityTooltip(OldSavesHelper.AbilityList[i], 0);
        }

        // Execute the preload file
        Preloader(filename);

        // Read the output
        i = 0;
        while (i < AbilityCount)
        {
            lev = 0;

            // Read from ability index 1 instead of 0 if backwards compatibility is enabled
#if BACKWARDS_COMPATABILITY
        if (i == 0)
        {
            lev = 1;
        }
#endif

            // Make sure the tooltip has changed
            chunk = BlzGetAbilityTooltip(OldSavesHelper.AbilityList[i], lev);

            if (chunk == original[i])
            {
                if (i == 0 && output == "")
                {
                    return null; // empty file
                }
                return output;
            }

            // Check if the file is an empty string or null
#if !BACKWARDS_COMPATABILITY
            if (i == 0)
            {
                if (chunk.Substring(0, 1) != "-")
                {
                    return null; // empty file
                }
                chunk = chunk.Substring(1);
            }
#endif

            // Remove the prefix
            if (i > 0)
            {
                chunk = chunk.Substring(1);
            }

            // Restore the tooltip and append the chunk
            BlzSetAbilityTooltip(OldSavesHelper.AbilityList[i], original[i], lev);

            output += chunk;
            i++;
        }

        return output;
    }


}
