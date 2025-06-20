using System;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Launcher
{
    public static class MapDesc
    {
        public static readonly string VERSION = "1.3.6";
        private static readonly string DISCORD = "discord.gg/GSu6zkNvx5";
        private static readonly string TITLE = $"|cffff0000RKR Remastered v{VERSION}|r";
        private static readonly string DATE = DateTime.Now.ToString("MM/dd/yyyy");

        private static readonly string DESCRIPTION =
            $"|cff00ffffRun Kitty Run|r v{VERSION} - |cff00ffff{DISCORD}|r\r\n"
          + "|n|n- Save System, Challenges, Music, and more! \r\n"
          + "|n|n- Check out our leaderboard in discord!\r\n"
          + $"|n|n|n|cff00ffffLast updated:|r |c00FF0000{DATE}|r";

        private static readonly Dictionary<string, string> replacements = new()
        {
            { "STRING 1", TITLE },
            { "STRING 3", DESCRIPTION },
            { "STRING 2018", $"Run Kitty Run Remastered v{VERSION}" }
        };

        private static readonly string FilePath =
            Path.Combine(Directory.GetParent(AppDomain.CurrentDomain.BaseDirectory)!.Parent!.Parent!.Parent!.Parent!.FullName,
                         @"source.w3x\war3map.wts");

        public static void UpdateWTSFile()
        {
            // Console.WriteLine(FilePath);
            if (!File.Exists(FilePath))
            {
                Console.WriteLine("Error: war3map.wts not found!");
                return;
            }

            string fileContent = File.ReadAllText(FilePath);

            foreach (var entry in replacements)
            {
                string pattern = @$"{entry.Key}\s*\{{.*?\}}";
                string replacement = $"{entry.Key}\n{{\n{entry.Value}\n}}";

                fileContent = Regex.Replace(fileContent, pattern, replacement, RegexOptions.Singleline);
            }

            File.WriteAllText(FilePath, fileContent);
        }
    }
}
