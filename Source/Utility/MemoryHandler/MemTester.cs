﻿using WCSharp.Api;

public static class MemoryHandlerTest
{
    public static int cylceCount = 0;
    private static timer t = timer.Create();

    private class TestDestroyable : IDestroyable
    {
        public string Name { get; set; }
        public int Count { get; set; }

        public void __destroy(bool recursive = false)
        {
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

    public static void PeriodicTest(bool on)
    {
        if (!on)
        {
            t.Pause();
            return;
        }
        t.Start(1.0f, true, ErrorHandler.Wrap(() =>
        {
            MemoryHandler.PrintDebugInfo();
        }));
    }
}
