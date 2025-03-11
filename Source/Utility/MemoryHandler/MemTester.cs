using System;
using WCSharp.Api;

public static class MemoryHandlerTest
{
    public static int cylceCount = 0;

    private class TestDestroyable : IDestroyable
    {
        public string Name { get; set; }
        public int Count { get; set; }
        public void __destroy(bool recursive = false)
        {
            Console.WriteLine($"Destroyed object: {Name}");
            Name = null;
            Count = 0;
        }
    }

    public static void RunTest()
    {
        var obj = MemoryHandler.GetEmptyObject<TestDestroyable>("TestDestroyable");
        obj.Name = "DummyObject";

        var arr = MemoryHandler.GetEmptyArray<TestDestroyable>("TestDestroyableArray", 3);
        for (int i = 0; i < arr.Length; i++)
        {
            arr[i] = new TestDestroyable { Name = $"ArrayObject{i}" };
        }

        MemoryHandler.PrintDebugInfo();

        MemoryHandler.DestroyObject(obj);
        MemoryHandler.DestroyArray(arr);

        MemoryHandler.PrintDebugInfo();
    }

    public static void PeriodicTest()
    {
        var t = timer.Create();

        t.Start(1.0f, true, () =>
        {

            cylceCount += 1;
            var obj = MemoryHandler.GetEmptyObject<TestDestroyable>("TestAffix");


            if (cylceCount == 6)
            {
                MemoryHandler.DestroyObject(obj);
            }

            MemoryHandler.PrintDebugInfo();
        });
    }
}

