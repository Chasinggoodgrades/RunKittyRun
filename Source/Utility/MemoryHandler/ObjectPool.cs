using System;
using System.Collections.Generic;

public static class ObjectPool<T> where T: class, new()
{
    private static readonly Queue<T> _pool = new Queue<T>();

    /// <summary>
    /// Returns an empty object of type <typeparamref name="T"/> from the pool if available, otherwise creates a new instance.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <returns><typeparamref name="T"/></returns>
    public static T GetEmptyObject()
    {
        return _pool.Count > 0 ? _pool.Dequeue() : new T();
    }

    /// <summary>
    /// Puts an object of type <typeparamref name="T"/> back to the pool to be recycled.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="obj"></param>
    public static void ReturnObject(T obj)
    {
        _pool.Enqueue(obj);
    }

    /// <summary>
    /// Prints debug information about all the object pools, including their counts.
    /// </summary>
    public static void PrintDebugInfo()
    {
        Console.WriteLine($"{Colors.COLOR_LAVENDER}Type: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{typeof(T).Name}, {Colors.COLOR_RESET}{Colors.COLOR_LAVENDER}Count: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{_pool.Count}{Colors.COLOR_RESET}");
    }
}
