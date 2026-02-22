using System;
using System.Collections.Generic;

public sealed class AffixCounter
{
    private static AffixCounter _instance;
    public static AffixCounter Instance => _instance ??= new AffixCounter();

    private class AffixEntry
    {
        public string Name { get; set; }
        public int Count { get; set; }

        public AffixEntry()
        {
            Name = null;
            Count = 0;
        }

        public void Dispose()
        {
            Count = 0;
            Name = null;
            ObjectPool<AffixEntry>.ReturnObject(this);
        }

    }

    private List<AffixEntry> _entries;
    private int _entryCount;
    private const int MAX_UNIQUE_AFFIXES = 20;

    private AffixCounter()
    {
        _entries = ObjectPool<AffixEntry>.GetEmptyList();
        _entryCount = 0;
    }

    public void Reset()
    {
        for (int i = 0; i < _entryCount; i++)
        {
            _entries[i].Dispose();
        }
        _entries.Clear();
        _entryCount = 0;
    }

    public void IncrementAffix(string affixName)
    {
        for (int i = 0; i < _entryCount; i++)
        {
            if (_entries[i].Name == affixName)
            {
                _entries[i].Count++;
                return;
            }
        }

        if (_entryCount < MAX_UNIQUE_AFFIXES)
        {
            var entry = ObjectPool<AffixEntry>.GetEmptyObject();
            entry.Name = affixName;
            entry.Count = 1;
            _entries.Add(entry);
            _entryCount++;
        }
    }

    public string[] GetResults()
    {
        if (_entryCount == 0) return Array.Empty<string>();

        var result = new string[_entryCount];
        for (int i = 0; i < _entryCount; i++)
        {
            result[i] = $"{_entries[i].Name} x{_entries[i].Count}";
        }
        return result;
    }
}
