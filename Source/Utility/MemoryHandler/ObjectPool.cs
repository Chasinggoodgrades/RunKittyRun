using System;
using System.Collections.Generic;

public static class ObjectPool<T> where T : class, new()
{
    private static readonly Queue<T> _pool = new Queue<T>();

    /// <summary>
    /// Returns an empty object of type <typeparamref name="T"/> from the pool if available, otherwise creates a new instance.
    /// </summary>
    public static T GetEmptyObject()
    {
        try
        {
            if (_pool.Count > 0)
            {
                var obj = _pool.Dequeue();
                return obj;
            }

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
    public static void ReturnObject(T obj)
    {
        try
        {
            if (obj == null)
            {
                Logger.Critical($"Attempted to return a null object of type {typeof(T).Name} to the pool.");
                return;
            }

            _pool.Enqueue(obj);
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in ObjectPool.ReturnObject: {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// Returns a pooled list of type <typeparamref name="T"/>. Clears the list before returning.
    /// </summary>
    public static List<T> GetEmptyList()
    {
        try
        {
            if (_listPool.Count > 0)
            {
                var list = _listPool.Dequeue();
                return list;
            }

            return new List<T>();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in ObjectPool.GetEmptyList: {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// Puts a list of type <typeparamref name="T"/> back to the pool to be recycled.
    /// </summary>
    public static void ReturnList(List<T> list)
    {
        try
        {
            if (list == null)
            {
                Logger.Critical($"Attempted to return a null list of type {typeof(List<T>).Name} to the pool.");
                return;
            }

            list.Clear();
            _listPool.Enqueue(list);
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in ObjectPool.ReturnList: {e.Message}");
            throw;
        }
    }

    public static void PrintDebugInfo()
    {
        Console.WriteLine($"{Colors.COLOR_LAVENDER}Type: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{typeof(T).Name}, {Colors.COLOR_RESET}" +
                          $"{Colors.COLOR_LAVENDER}Object Count: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{_pool.Count}{Colors.COLOR_RESET}, " +
                          $"{Colors.COLOR_LAVENDER}List Count: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{_listPool.Count}{Colors.COLOR_RESET}");
    }

    private static readonly Queue<List<T>> _listPool = new Queue<List<T>>();
}
