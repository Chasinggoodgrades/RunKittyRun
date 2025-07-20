using System;
using System.Collections.Generic;

// -----------------------------------------
// Sample Types to Pool
// -----------------------------------------
public class TimerHandle
{
    public float Duration;
    public bool IsPaused;

    public override string ToString() => $"TimerHandle(Duration={Duration}, Paused={IsPaused})";
}

public class Enemy
{
    public int Health;
    public float X;
    public float Y;

    public override string ToString() => $"Enemy(Health={Health}, Pos=({X},{Y}))";
}

// -----------------------------------------
// Type-Specific Object Pool
// -----------------------------------------
public static class ObjectPool<T> where T : class, new()
{
    private static readonly Queue<T> _pool = new Queue<T>();
    private static T _lastObject;

    public static T Get()
    {
        if (_pool.Count > 0)
        {
            var obj = _pool.Dequeue();

            if (ReferenceEquals(_lastObject, obj))
            {
                Console.WriteLine($"[WARN] Reused same instance of {typeof(T).Name}. Allocating new.");
                return new T();
            }

            _lastObject = obj;
            return obj;
        }

        return new T();
    }

    public static void Return(T obj)
    {
        if (obj == null)
        {
            Console.WriteLine($"[CRITICAL] Tried to return null {typeof(T).Name}");
            return;
        }

        _pool.Enqueue(obj);
    }

    public static int Count => _pool.Count;
}

// -----------------------------------------
// Type-Specific List Pool
// -----------------------------------------
public static class ListPool<T> where T : class
{
    private static readonly Queue<List<T>> _pool = new Queue<List<T>>();
    private static List<T> _lastList;

    public static List<T> Get()
    {
        if (_pool.Count > 0)
        {
            var list = _pool.Dequeue();

            if (ReferenceEquals(_lastList, list))
            {
                Console.WriteLine($"[WARN] Reused same list of {typeof(List<T>).Name}. Allocating new.");
                return new List<T>();
            }

            _lastList = list;
            return list;
        }

        return new List<T>();
    }

    public static void Return(List<T> list)
    {
        if (list == null)
        {
            Console.WriteLine($"[CRITICAL] Tried to return null list of {typeof(List<T>).Name}");
            return;
        }

        list.Clear();
        _pool.Enqueue(list);
    }

    public static int Count => _pool.Count;
}

// -----------------------------------------
// Test Runner
// -----------------------------------------
public static class PoolTestRunner
{
}
