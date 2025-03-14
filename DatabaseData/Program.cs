using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using System.Collections.Generic;
using WCSharp.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var summary = new Benchmark();
        summary.BenchmarkMemoryUsage();
    }
}

/* PERFORMANCE RESULTS
|   Method                | Mean | Error | StdDev | Median |
|----------------- |-----------:|----------:|----------:|-----------:|
| AccessDictionary | 34.5290 ns| 0.6897 ns | 1.2784 ns | 34.3620 ns |
| AccessClass      | 0.0086 ns | 0.0177 ns | 0.0157 ns | 0.0000 ns |
| AccessList       | 0.7533 ns | 0.0357 ns | 0.0439 ns | 0.7462 ns |
*/

public class Benchmark
{
    private Dictionary<string, object> dictionary;
    private ActiveAwards activeAwards;
    private List<object> list;

    [GlobalSetup]
    public void Setup()
    {
        dictionary = new Dictionary<string, object>
        {
            { "ActiveWings", "null" },
            { "ActiveHats", "null" },
            { "ActiveTrail", "null" },
            { "ActiveAura", "null" },
            { "WindwalkID", 2 }
        };

        activeAwards = new ActiveAwards
        {
            ActiveWings = "null",
            ActiveHats = "null",
            ActiveTrail = "null",
            ActiveAura = "null",
            WindwalkID = 2
        };

        list = new List<object>
        {
            "null", // ActiveWings
            "null", // ActiveHats
            "null", // ActiveTrail
            "null", // ActiveAura
            2     // WindwalkID
        };

        /*
            [Benchmark]
            public void AccessDictionary()
            {
                var wings = dictionary["ActiveWings"];
                var hats = dictionary["ActiveHats"];
                var trail = dictionary["ActiveTrail"];
                var aura = dictionary["ActiveAura"];
                var windwalkID = dictionary["WindwalkID"];
            }

            [Benchmark]
            public void AccessClass()
            {
                var wings = activeAwards.ActiveWings;
                var hats = activeAwards.ActiveHats;
                var trail = activeAwards.ActiveTrail;
                var aura = activeAwards.ActiveAura;
                var windwalkID = activeAwards.WindwalkID;
            }

            [Benchmark]
            public void AccessList()
            {
                var wings = list[0];
                var hats = list[1];
                var trail = list[2];
                var aura = list[3];
                var windwalkID = (int)list[4];
            }*/
    }

    public void BenchmarkMemoryUsage()
    {
        List<ActiveAwards> activeAwardsList = new List<ActiveAwards>();
        Dictionary<string, string> activeAwardsDictionary = new Dictionary<string, string>();

        // Populate the list
        for (int i = 0; i < 1000; i++)
        {
            activeAwardsList.Add(new ActiveAwards
            {
                ActiveWings = $"Wings{i}",
                ActiveHats = $"Hats{i}",
                ActiveTrail = $"Trail{i}",
                ActiveAura = $"Aura{i}",
                WindwalkID = i
            });
        }

        // Populate the dictionary
        for (int i = 0; i < 1000; i++)
        {
            activeAwardsDictionary[$"ActiveWings{i}"] = $"Wings{i}";
            activeAwardsDictionary[$"ActiveHats{i}"] = $"Hats{i}";
            activeAwardsDictionary[$"ActiveTrail{i}"] = $"Trail{i}";
            activeAwardsDictionary[$"ActiveAura{i}"] = $"Aura{i}";
            activeAwardsDictionary[$"WindwalkID{i}"] = i.ToString();
        }
    }
}


    public class ActiveAwards
{
    public object ActiveWings { get; set; }
    public object ActiveHats { get; set; }
    public object ActiveTrail { get; set; }
    public object ActiveAura { get; set; }
    public int WindwalkID { get; set; }
}

