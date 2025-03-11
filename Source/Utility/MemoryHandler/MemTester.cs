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
        var arr = MemoryHandler.GetEmptyArray<ClusterData>(null, 9);
        for (int i = 0; i < arr.Length; i++)
        {
            arr[i] = new ClusterData();
        }

        MemoryHandler.PrintDebugInfo();
    }

    public static void PeriodicTest()
    {
        var t = timer.Create();

        t.Start(1.0f, true, () =>
        {

/*            cylceCount += 1;
            var obj = MemoryHandler.GetEmptyObject<TestDestroyable>("TestAffix");


            if (cylceCount == 6)
            {
                MemoryHandler.DestroyObject(obj);
            }*/

            MemoryHandler.PrintDebugInfo();
        });
    }
}

