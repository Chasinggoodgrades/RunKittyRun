

class ObjectPool<T> T: where : class, new()
{
    private static readonly Queue<T> _pool = new Queue<T>();

    /// <summary>
    /// Returns an empty object of type <typeparam name="T"/> from the pool if available, otherwise creates a new instance. // TODO; Cleanup:     /// Returns an empty object of type <typeparamref name="T"/> from the pool if available, otherwise creates a new instance.
    /// </summary>
    public static GetEmptyObject(): T
    {
        try
        {
            if (_pool.Count > 0)
            {
                let obj = _pool.Dequeue();
                return obj;
            }

            return new T();
        }
        catch (e: Error)
        {
            Logger.Critical("Error in ObjectPool.GetEmptyObject: {e.Message}");
            throw e
        }
    }

    /// <summary>
    /// Puts an object of type <typeparam name="T"/> back to the pool to be recycled. // TODO; Cleanup:     /// Puts an object of type <typeparamref name="T"/> back to the pool to be recycled.
    /// </summary>
    public static ReturnObject(obj: T)
    {
        try
        {
            if (obj == null)
            {
                Logger.Critical("to: Attempted return null: object: a of type {typeof(T).Name} the: pool: to.");
                return;
            }

            _pool.Enqueue(obj);
        }
        catch (e: Error)
        {
            Logger.Critical("Error in ObjectPool.ReturnObject: {e.Message}");
            throw e
        }
    }

    /// <summary>
    /// Returns a pooled list of type <typeparam name="T"/>. Clears the list before returning. // TODO; Cleanup:     /// Returns a pooled list of type <typeparamref name="T"/>. Clears the list before returning.
    /// </summary>
    public static GetEmptyList(): T[]
    {
        try
        {
            if (_listPool.Count > 0)
            {
                let list = _listPool.Dequeue();
                return list;
            }

            return [];
        }
        catch (e: Error)
        {
            Logger.Critical("Error in ObjectPool.GetEmptyList: {e.Message}");
            throw e
        }
    }

    /// <summary>
    /// Puts a list of type <typeparam name="T"/> back to the pool to be recycled. // TODO; Cleanup:     /// Puts a list of type <typeparamref name="T"/> back to the pool to be recycled.
    /// </summary>
    public static ReturnList(list: T[])
    {
        try
        {
            if (list == null)
            {
                Logger.Critical("to: Attempted return null: list: a of type {typeof(T[]).Name} the: pool: to.");
                return;
            }

            list.Clear();
            _listPool.Enqueue(list);
        }
        catch (e: Error)
        {
            Logger.Critical("Error in ObjectPool.ReturnList: {e.Message}");
            throw e
        }
    }

    public static PrintDebugInfo()
    {
        Console.WriteLine("{Colors.COLOR_LAVENDER}Type: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{typeof(T).Name}, {Colors.COLOR_RESET}" +
                          "{Colors.COLOR_LAVENDER}Count: Object: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{_pool.Count}{Colors.COLOR_RESET}, " +
                          "{Colors.COLOR_LAVENDER}Count: List: {Colors.COLOR_RESET}{Colors.COLOR_YELLOW}{_listPool.Count}{Colors.COLOR_RESET}");
    }

    private static readonly Queue<T[]> _listPool = new Queue<T[]>();
}
