using System;
using System.Collections.Generic;

public static class ObjectPool
{
    private static readonly Dictionary<Type, Queue<object>> _pools = new Dictionary<Type, Queue<object>>();

    /// <summary>
    /// Returns an empty object of type <typeparamref name="T"/> from the pool if available, otherwise creates a new instance.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <returns><typeparamref name="T"/></returns>
    public static T GetEmptyObject<T>() where T : class, new()
    {
        try
        {
            // Gotta check if we have the type && some objects in the pool, then return it.
            if (_pools.TryGetValue(typeof(T), out var pool) && pool.Count > 0)
            {
                return (T)pool.Dequeue();
            }

            // we got no objects in pool, lets return a new one of <T>
            return new T();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in ObjectPool.GetEmptyObject: {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// Puts an object of type <typeparamref name="T"/> back to the pool to be recycled.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="obj"></param>
    public static void ReturnObject<T>(T obj) where T : class
    {
        try
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
        catch (Exception e)
        {
            Logger.Critical($"Error in ObjectPool.ReturnObject: {e.Message}");
            throw;
        }
    }

    public static List<T> GetEmptyList<T>() where T : class, new()
    {
        try
        {
            if (_pools.TryGetValue(typeof(List<T>), out var pool) && pool.Count > 0)
            {
                return (List<T>)pool.Dequeue();
            }

            return new List<T>();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in ObjectPool.GetEmptyList: {e.Message}");
            throw;
        }
    }

    public static void ReturnList<T>(List<T> list) where T : class
    {
        try
        {
            list.Clear(); // Make sure to clear the list before returning it

            if (!_pools.TryGetValue(typeof(List<T>), out var pool))
            {
                pool = new Queue<object>();
                _pools[typeof(List<T>)] = pool;
            }

            pool.Enqueue(list);
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in ObjectPool.ReturnList: {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// Prints debug information about all the object pools, including their counts.
    /// </summary>
    public static void PrintDebugInfo()
    {
        foreach (var kvp in _pools)
        {
            var type = kvp.Key;
            var count = kvp.Value.Count;
            Logger.Critical($"{Colors.COLOR_LAVENDER}Type: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{type.Name}, {Colors.COLOR_RESET}{Colors.COLOR_LAVENDER}Count: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{count}{Colors.COLOR_RESET}");
        }
    }
}
