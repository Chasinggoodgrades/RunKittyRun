using System;
using System.Collections.Generic;

public static class ObjectPool
{
    private static readonly Dictionary<Type, Queue<object>> _pools = new Dictionary<Type, Queue<object>>();

    public static T GetEmptyObject<T>() where T : class, new()
    {
        // Gotta check if we have the type && some objects in the pool, then return it.
        if (_pools.TryGetValue(typeof(T), out var pool) && pool.Count > 0)
        {
            return (T)pool.Dequeue();
        }

        // we got no objects in pool, lets return a new one of <T>
        return new T();
    }

    public static void ReturnObject<T>(T obj) where T : class
    {
        // if we don't got a queue object to represent the pool, create a new 1
        if (!_pools.TryGetValue(typeof(T), out var pool))
        {
            pool = new Queue<object>();
            _pools[typeof(T)] = pool;
        }

        // put the object back in the pool <T>
        pool.Enqueue(obj);
    }

    public static void PrintDebugInfo()
    {
        foreach (var kvp in _pools)
        {
            var type = kvp.Key;
            var count = kvp.Value.Count;
            Console.WriteLine($"{Colors.COLOR_LAVENDER}Type: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{type.Name}, {Colors.COLOR_RESET}{Colors.COLOR_LAVENDER}Count: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{count}{Colors.COLOR_RESET}");
        }
    }
}
