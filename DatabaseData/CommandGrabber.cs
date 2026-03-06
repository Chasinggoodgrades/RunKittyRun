using System.Text;
using System.Text.RegularExpressions;

namespace CommandExtractor
{
    public class CommandExtractor
    {
        public static void CommandFinder()
        {
            string repoRoot = FindRepositoryRoot();
            if (repoRoot == null)
            {
                Console.WriteLine("Could not find repository root. Make sure you're running from within the RunKittyRun repository.");
                return;
            }

            string inputFilePath = Path.Combine(repoRoot, @"Source\Events\Commands\COMMAND REVAMP\InitCommands.cs");

            if (!File.Exists(inputFilePath))
            {
                Console.WriteLine($"File not found at: {inputFilePath}");
                return;
            }

            Console.WriteLine($"Reading commands from: {inputFilePath}");
            string fileContent = File.ReadAllText(inputFilePath);

            var regex = new Regex(
                @"CommandsManager\.RegisterCommand\(\s*.*?name\s*:\s*""(?<name>[^""]+)""\s*,.*?tier\s*:\s*CommandTier\.(?<tier>\w+)\s*,.*?argDesc\s*:\s*""(?<args>[^""]*)""\s*,.*?description\s*:\s*""(?<desc>[^""]+)""",
                RegexOptions.Singleline);

            MatchCollection matches = regex.Matches(fileContent);
            var commands = new (string Name, string Tier, string Args, string Desc)[matches.Count];
            for (int i = 0; i < matches.Count; i++)
            {
                commands[i] = (
                    matches[i].Groups["name"].Value,
                    matches[i].Groups["tier"].Value,
                    matches[i].Groups["args"].Value,
                    matches[i].Groups["desc"].Value
                );
            }

            string[] tierOrder = { "All", "VIP", "Red", "Admin", "Developer" };
            Array.Sort(commands, (a, b) =>
            {
                int ia = Array.IndexOf(tierOrder, a.Tier);
                int ib = Array.IndexOf(tierOrder, b.Tier);
                if (ia < 0) ia = tierOrder.Length;
                if (ib < 0) ib = tierOrder.Length;
                int cmp = ia.CompareTo(ib);
                return cmp != 0 ? cmp : string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase);
            });

            string outputDir = Path.GetDirectoryName(inputFilePath);
            WriteTxt(commands, Path.Combine(outputDir, "ExtractedCommands.txt"));
            WriteCsv(commands, Path.Combine(outputDir, "ExtractedCommands.csv"));
        }

        private static void WriteTxt((string Name, string Tier, string Args, string Desc)[] commands, string filePath)
        {
            var sb = new StringBuilder();
            string currentTier = null;
            foreach (var cmd in commands)
            {
                if (cmd.Tier != currentTier)
                {
                    if (currentTier != null) sb.AppendLine();
                    sb.AppendLine($"**{cmd.Tier} Commands**");
                    currentTier = cmd.Tier;
                }
                sb.AppendLine($"- {cmd.Name} [{cmd.Args}] - {cmd.Desc}");
            }

            try
            {
                File.WriteAllText(filePath, sb.ToString());
                Console.WriteLine($"TXT saved to: {filePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error writing TXT: {ex.Message}");
            }
        }

        private static void WriteCsv((string Name, string Tier, string Args, string Desc)[] commands, string filePath)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Tier,Command,Arguments,Description");
            foreach (var cmd in commands)
                sb.AppendLine($"{cmd.Tier},{EscapeCsv(cmd.Name)},{EscapeCsv(cmd.Args)},{EscapeCsv(cmd.Desc)}");

            try
            {
                File.WriteAllText(filePath, sb.ToString());
                Console.WriteLine($"CSV saved to: {filePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error writing CSV: {ex.Message}");
            }
        }

        private static string EscapeCsv(string value)
        {
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
                return $"\"{value.Replace("\"", "\"\"")}\"";
            return value;
        }

        private static string FindRepositoryRoot()
        {
            string currentDir = AppContext.BaseDirectory;

            while (currentDir != null)
            {
                // Look for .git directory or Source directory as indicators of repo root
                if (Directory.Exists(Path.Combine(currentDir, ".git")) ||
                    Directory.Exists(Path.Combine(currentDir, "Source")))
                {
                    return currentDir;
                }

                currentDir = Directory.GetParent(currentDir)?.FullName;
            }

            return null;
        }
    }
}
