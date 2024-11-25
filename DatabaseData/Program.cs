using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
public class Program
{
    public static Dictionary<int, string> EnumToDictionary<T>() where T : Enum
    {
        var dict = new Dictionary<int, string>();
        foreach (var value in Enum.GetValues(typeof(T)))
        {
            dict.Add((int)value, value.ToString());
        }
        return dict;
    }

    public static void Main()
    {
        // Create dictionaries for each enum
        Program2.StartSomething();
/*        var selectedDataDict = EnumToDictionary<SelectedData>();
        var roundTimesDict = EnumToDictionary<RoundTimes>();
        var statTypesDict = EnumToDictionary<StatTypes>();
        var awardsDict = EnumToDictionary<Awards>();

        // Generate JavaScript const strings
        var selectedDataConst = GenerateJsConst("SelectedData", selectedDataDict);
        var roundTimesConst = GenerateJsConst("RoundTimes", roundTimesDict);
        var statTypesConst = GenerateJsConst("StatTypes", statTypesDict);
        var awardsConst = GenerateJsConst("Awards", awardsDict);

        // Print JavaScript const strings
        Console.WriteLine(selectedDataConst);
        Console.WriteLine(roundTimesConst);
        Console.WriteLine(statTypesConst);
        Console.WriteLine(awardsConst);

        // Write JavaScript const strings to a file
        File.WriteAllText("enums.js", $"{selectedDataConst}\n\n{roundTimesConst}\n\n{statTypesConst}\n\n{awardsConst}");*/
    }

    public static string GenerateJsConst(string constName, Dictionary<int, string> enumDict)
    {
        var entries = enumDict.Select(kvp => $"    {kvp.Value}: {kvp.Key}").ToArray();
        var entriesString = string.Join(",\n", entries);
        return $"const {constName} = {{\n{entriesString}\n}};";
    }
}
