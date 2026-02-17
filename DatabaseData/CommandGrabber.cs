using System.Text.RegularExpressions;

namespace CommandExtractor
{
    class Program
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
                @"CommandsManager\.RegisterCommand\(\s*.*?name\s*:\s*""(?<name>[^""]+)""\s*,.*?group\s*:\s*""(?<group>[^""]+)""\s*,.*?argDesc\s*:\s*""(?<args>[^""]*)""\s*,.*?description\s*:\s*""(?<desc>[^""]+)""",
                RegexOptions.Singleline);

            MatchCollection matches = regex.Matches(fileContent);
            var commandDictionary = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            foreach (Match match in matches)
            {
                string commandName = match.Groups["name"].Value;
                string groupName = match.Groups["group"].Value;
                string arguments = match.Groups["args"].Value;
                string description = match.Groups["desc"].Value;

                string formattedCommand = $"{commandName} [{arguments}] - {description}";

                if (!commandDictionary.ContainsKey(groupName))
                {
                    commandDictionary[groupName] = new List<string>();
                }
                commandDictionary[groupName].Add(formattedCommand);
            }

            foreach (var key in commandDictionary.Keys.ToList())
            {
                commandDictionary[key].Sort(StringComparer.OrdinalIgnoreCase);
            }

            var sortedGroups = commandDictionary.Keys.OrderBy(g => g, StringComparer.OrdinalIgnoreCase).ToList();

            List<string> outputLines = new List<string>();
            foreach (var group in sortedGroups)
            {
                outputLines.Add($"**{group} Commands**");
                foreach (var command in commandDictionary[group])
                {
                    outputLines.Add($"- {command}");
                }
                outputLines.Add("");
            }

            string outputFilePath = Path.Combine(Path.GetDirectoryName(inputFilePath), "ExtractedCommands.txt");

            try
            {
                File.WriteAllLines(outputFilePath, outputLines);
                Console.WriteLine($"Output successfully saved to: {outputFilePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error writing output: {ex.Message}");
            }
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
