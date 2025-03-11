using System;
using System.Collections.Generic;
using System.Linq;

public static class MemoryHandler
{
    private static int numCreatedObjects;
    private static int numCreatedArrays;

    private static readonly Dictionary<string, int> debugObjects = new();
    private static readonly Dictionary<string, int> debugArrays = new();

    private static readonly Dictionary<Type, List<object>> cachedObjects = new();
    private static readonly List<Array> cachedArrays = new();

    // BECAUSE NO setmetadata and getmetadata .. got improvise
    private static readonly Dictionary<object, Dictionary<string, object>> MetaTable = new();

    #region Core Purge Logic

    private static void PurgeObject(object obj, bool recursive = false)
    {
        // Pretend each object is a dictionary of fields to ultimately null
        // obj == metadata .. instead dictionary (fuck dictionaries)
        if (obj is Dictionary<string, object> dict)
        {
            foreach (var key in new List<string>(dict.Keys))
            {
                if (recursive && dict[key] is IDestroyable destroyable)
                {
                    destroyable.__destroy(true);
                }
                dict[key] = null;
            }
        }

        // 
        if (MetaTable.TryGetValue(obj, out var meta))
        {
            if (meta.TryGetValue("__debugName", out var debugNameObj) && debugNameObj is string dbgName)
            {
                if (debugObjects.ContainsKey(dbgName))
                {
                    debugObjects[dbgName]--;
                    if (debugObjects[dbgName] <= 0)
                        _ = debugObjects.Remove(dbgName);
                }
            }
            meta["__debugName"] = null;
            meta["__destroyed"] = true;
        }
    }

    private static void PurgeArray(object[] arr, bool recursive = false)
    {
        for (int i = 0; i < arr.Length; i++)
        {
            if (recursive && arr[i] is IDestroyable destroyable)
            {
                destroyable.__destroy(true);
            }
            arr[i] = null;
        }

        // Look up meta info
        if (MetaTable.TryGetValue(arr, out var meta))
        {
            if (meta.TryGetValue("__debugName", out var debugNameObj) && debugNameObj is string dbgName)
            {
                if (debugArrays.ContainsKey(dbgName))
                {
                    debugArrays[dbgName]--;
                    if (debugArrays[dbgName] <= 0)
                        _ = debugArrays.Remove(dbgName);
                }
            }
            meta["__debugName"] = null;
            meta["__destroyed"] = true;
        }
    }

    private static void DestroyObject(object obj, bool recursive = false)
    {
        PurgeObject(obj, recursive);
        var type = obj.GetType();
        if (!cachedObjects.ContainsKey(type))
        {
            cachedObjects[type] = new List<object>();
        }
        cachedObjects[type].Add(obj);
    }

    private static void DestroyArray(object[] arr, bool recursive = false)
    {
        PurgeArray(arr, recursive);
        cachedArrays.Add(arr);
    }

    #endregion

    #region Metatable Creation

    private static Dictionary<string, object> GetObjectMeta(string debugName = null)
    {
        var meta = new Dictionary<string, object>
        {
            { "__gc", (Action<object, bool>)DestroyObject },
            { "__destroyed", false }
        };
        if (!string.IsNullOrEmpty(debugName))
        {
            meta["__debugName"] = debugName;
        }
        return meta;
    }

    private static Dictionary<string, object> GetArrayMeta(string debugName = null)
    {
        var meta = new Dictionary<string, object>
        {
            { "__gc", (Action<object[], bool>)DestroyArray },
            { "__destroyed", false }
        };
        if (!string.IsNullOrEmpty(debugName))
        {
            meta["__debugName"] = debugName;
        }
        return meta;
    }

    private static readonly Dictionary<string, object> defaultObjectMeta = GetObjectMeta();
    private static readonly Dictionary<string, object> defaultArrayMeta = GetArrayMeta();

    #endregion

    #region Public API

    /// <summary>
    /// Returns an object of type T, reusing from cached objects if possible, or creating a new one.
    /// If debugName is set, attaches it to the created or reused object's metadata.
    /// </summary>
    public static T GetEmptyObject<T>(string debugName = null)
        where T : class, IDestroyable, new()
    {
        var type = typeof(T);
        if (cachedObjects.TryGetValue(type, out var objects) && objects.Count > 0)
        {
            var obj = (T)objects[0];
            objects.RemoveAt(0);

            if (!string.IsNullOrEmpty(debugName) && MetaTable.TryGetValue(obj, out var meta))
            {
                meta["__debugName"] = debugName;
                meta["__destroyed"] = false;
            }
            else if (!string.IsNullOrEmpty(debugName))
            {
                MetaTable[obj] = GetObjectMeta(debugName);
            }

            if (!string.IsNullOrEmpty(debugName))
            {
                if (!debugObjects.ContainsKey(debugName))
                    debugObjects[debugName] = 0;
                debugObjects[debugName]++;
            }

            return obj;
        }
        else
        {
            var obj = new T();
            numCreatedObjects++;

            var meta = !string.IsNullOrEmpty(debugName)
                ? GetObjectMeta(debugName)
                : defaultObjectMeta;

            MetaTable[obj] = meta;

            if (!string.IsNullOrEmpty(debugName))
            {
                if (!debugObjects.ContainsKey(debugName))
                    debugObjects[debugName] = 0;
                debugObjects[debugName]++;
            }

            return obj;
        }
    }

    /// <summary>
    /// Returns an empty array of T, reusing from cached arrays if possible, or creating a new one.
    /// If debugName is set, attaches it to the array's metadata.
    /// </summary>
    public static T[] GetEmptyArray<T>(string debugName = null, int length = 0)
    {
        if (cachedArrays.Count > 0)
        {
            var arr = cachedArrays[0];
            cachedArrays.RemoveAt(0);

            // Try casting to T[] so Array.Resize and indexing work
            if (arr is T[] typedArr)
            {
                if (typedArr.Length < length)
                {
                    // Explicitly specify type on Array.Resize
                    Array.Resize<T>(ref typedArr, length);
                }

                // Update metadata
                if (!string.IsNullOrEmpty(debugName) && MetaTable.TryGetValue(typedArr, out var meta))
                {
                    meta["__debugName"] = debugName;
                    meta["__destroyed"] = false;
                }
                else if (!string.IsNullOrEmpty(debugName))
                {
                    MetaTable[typedArr] = GetArrayMeta(debugName);
                }

                if (!string.IsNullOrEmpty(debugName))
                {
                    if (!debugArrays.ContainsKey(debugName))
                        debugArrays[debugName] = 0;
                    debugArrays[debugName]++;
                }
                return typedArr;
            }
            else
            {
                // If it's not T[], create a new one and copy over elements safely
                var newArr = new T[length];
                for (int i = 0; i < Math.Min(arr.Length, length); i++)
                {
                    newArr[i] = (T)arr.GetValue(i);
                }

                // Update metadata
                MetaTable[newArr] = !string.IsNullOrEmpty(debugName) ? GetArrayMeta(debugName) : defaultArrayMeta;
                if (!string.IsNullOrEmpty(debugName))
                {
                    if (!debugArrays.ContainsKey(debugName))
                        debugArrays[debugName] = 0;
                    debugArrays[debugName]++;
                }
                return newArr;
            }
        }
        else
        {
            // Create fresh
            var arr = new T[length];
            numCreatedArrays++;
            MetaTable[arr] = !string.IsNullOrEmpty(debugName) ? GetArrayMeta(debugName) : defaultArrayMeta;
            if (!string.IsNullOrEmpty(debugName))
            {
                if (!debugArrays.ContainsKey(debugName))
                    debugArrays[debugName] = 0;
                debugArrays[debugName]++;
            }
            return arr;
        }
    }

    /// <summary>
    /// Destroys a previously returned object (calls PurgeObject internally) and caches it.
    /// </summary>
    public static void DestroyObject<T>(T obj, bool recursive = false) where T : class
    {
        DestroyObject((object)obj, recursive);
    }

    /// <summary>
    /// Destroys a previously returned array (calls PurgeArray internally) and caches it.
    /// </summary>
    public static void DestroyArray<T>(T[] arr, bool recursive = false)
    {
        // Purge the array elements
        for (int i = 0; i < arr.Length; i++)
        {
            if (recursive && arr[i] is IDestroyable destroyable)
            {
                destroyable.__destroy(true);
            }
            arr[i] = default;
        }

        // Look up meta info
        if (MetaTable.TryGetValue(arr, out var meta))
        {
            if (meta.TryGetValue("__debugName", out var debugNameObj) && debugNameObj is string dbgName)
            {
                if (debugArrays.ContainsKey(dbgName))
                {
                    debugArrays[dbgName]--;
                    if (debugArrays[dbgName] <= 0)
                        _ = debugArrays.Remove(dbgName);
                }
            }
            meta["__debugName"] = null;
            meta["__destroyed"] = true;
        }

        // Add the array back to the cache for reuse
        cachedArrays.Add(arr);
    }

    /// <summary>
    /// Clones the source array into a new array (exact copy).
    /// </summary>
    public static T[] CloneArray<T>(T[] arr)
    {
        var newArray = GetEmptyArray<T>(null, arr.Length);
        Array.Copy(arr, newArray, arr.Length);
        return newArray;
    }

    /// <summary>
    /// Prints debug info about how many objects/arrays have been created and reused.
    /// Shows up to ten top “debugName” usage counts for objects and arrays.
    /// </summary>
    public static void PrintDebugInfo()
    {
        Console.WriteLine("MemoryHandler");
        Console.WriteLine($"Objects: {numCreatedObjects - cachedObjects.Values.Sum(list => list.Count)}/{numCreatedObjects}");
        Console.WriteLine($"Arrays: {numCreatedArrays - cachedArrays.Count}/{numCreatedArrays}");

        PrintDebugNames("objects", debugObjects);
        PrintDebugNames("arrays", debugArrays);

        // If you have a trackPrintMap in your environment, you could reference it here.
        if (InitCommands._G.trackPrintMap == true)
        {
            PrintDebugNames("globals", InitCommands._G.__fakePrintMap);
        }
    }

    private static void PrintDebugNames(string title, Dictionary<string, int> targets)
    {
        // Could reuse a typed object list if desired, but we’ll keep it simple
        var sorted = new List<KeyValuePair<string, int>>(targets);
        sorted.Sort((a, b) => b.Value.CompareTo(a.Value));

        if (sorted.Count <= 0) return;

        int i = 0;
        var output = "";
        foreach (var item in sorted)
        {
            if (i++ < 10)
            {
                output += (output.Length > 0 ? ", " : "") + $"{item.Key}: {item.Value}";
            }
        }

        Console.WriteLine($"Most used {title}: {output}");
    }

    #endregion
}
