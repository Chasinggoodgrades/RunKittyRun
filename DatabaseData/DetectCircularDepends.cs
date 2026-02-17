using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

class CircularDependencyDetector
{
    public static void DetectCircularDependencies()
    {
        string root = FindRootDirectory("Source");
        if (string.IsNullOrWhiteSpace(root))
        {
            Console.WriteLine("Could not locate source root.");
            return;
        }

        var files = Directory.GetFiles(root, "*.cs", SearchOption.AllDirectories);

        Console.WriteLine(string.Join(Environment.NewLine, files));
        var typeToFile = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            string ns = ExtractNamespace(file);
            foreach (var typeName in ExtractTypeNames(file))
            {
                var qualifiedName = string.IsNullOrWhiteSpace(ns) ? typeName : $"{ns}.{typeName}";
                if (!typeToFile.ContainsKey(qualifiedName))
                    typeToFile[qualifiedName] = file;

                if (!typeToFile.ContainsKey(typeName))
                    typeToFile[typeName] = file;
            }
        }

        // Build dependency graph: file → list of files it depends on
        var graph = new Dictionary<string, List<string>>();

        foreach (var file in files)
        {
            var deps = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var usedType in ExtractTypeReferences(file))
            {
                if (typeToFile.TryGetValue(usedType, out var depFile) && depFile != file)
                {
                    deps.Add(depFile);
                }
            }

            graph[file] = deps.ToList();
        }

        // Detect cycles
        var visited = new HashSet<string>();
        var stack = new HashSet<string>();
        var cycles = new List<List<string>>();

        foreach (var file in graph.Keys)
        {
            DFS(file, graph, visited, stack, new List<string>(), cycles);
        }

        if (cycles.Count == 0)
        {
            Console.WriteLine("No circular dependencies detected.");
        }
        else
        {
            Console.WriteLine("Circular dependencies found:\n");

            int i = 1;
            foreach (var cycle in cycles)
            {
                Console.WriteLine($"Cycle {i++}:");
                foreach (var f in cycle)
                    Console.WriteLine("  " + f);
                Console.WriteLine();
            }
        }
    }

    static IEnumerable<string> ExtractTypeNames(string file)
    {
        foreach (var line in File.ReadLines(file))
        {
            var trimmed = line.Trim();
            if (trimmed.Contains(" class ") || trimmed.StartsWith("class ") ||
                trimmed.Contains(" struct ") || trimmed.StartsWith("struct ") ||
                trimmed.Contains(" interface ") || trimmed.StartsWith("interface ") ||
                trimmed.Contains(" enum ") || trimmed.StartsWith("enum ") ||
                trimmed.Contains(" record ") || trimmed.StartsWith("record "))
            {
                var parts = trimmed.Split(new[] { ' ', ':', '(' }, StringSplitOptions.RemoveEmptyEntries);
                var typeIndex = Array.FindIndex(parts, p => p == "class" || p == "struct" || p == "interface" || p == "enum" || p == "record");
                if (typeIndex >= 0 && typeIndex + 1 < parts.Length)
                    yield return parts[typeIndex + 1].Trim();
            }
        }
    }

    static IEnumerable<string> ExtractTypeReferences(string file)
    {
        var text = File.ReadAllText(file);
        var tokens = text
            .Replace("\r", " ")
            .Replace("\n", " ")
            .Split(new[] { ' ', '\t', '(', ')', '{', '}', '[', ']', ';', ',', '<', '>', '=', '+', '-', '*', '/', ':' }, StringSplitOptions.RemoveEmptyEntries);

        foreach (var token in tokens)
        {
            if (token.Length > 0 && char.IsUpper(token[0]))
                yield return token;
        }
    }

    static string FindRootDirectory(string marker)
    {
        var current = AppContext.BaseDirectory;
        while (!string.IsNullOrWhiteSpace(current))
        {
            var candidate = Path.Combine(current, marker);
            if (Directory.Exists(candidate))
                return candidate;

            current = Directory.GetParent(current)?.FullName;
        }

        return null;
    }

    static void DFS(
        string file,
        Dictionary<string, List<string>> graph,
        HashSet<string> visited,
        HashSet<string> stack,
        List<string> path,
        List<List<string>> cycles)
    {
        if (stack.Contains(file))
        {
            // Cycle found
            int idx = path.IndexOf(file);
            if (idx >= 0)
            {
                var cycle = path.Skip(idx).Concat(new[] { file }).ToList();
                cycles.Add(cycle);
            }
            return;
        }

        if (visited.Contains(file))
            return;

        visited.Add(file);
        stack.Add(file);
        path.Add(file);

        foreach (var dep in graph[file])
        {
            DFS(dep, graph, visited, stack, path, cycles);
        }

        stack.Remove(file);
        path.RemoveAt(path.Count - 1);
    }

    static string ExtractNamespace(string file)
    {
        foreach (var line in File.ReadLines(file))
        {
            var trimmed = line.Trim();
            if (trimmed.StartsWith("namespace "))
            {
                return trimmed.Substring("namespace ".Length).Trim().TrimEnd('{', ' ');
            }
        }
        return null;
    }

}
