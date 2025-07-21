using System;
using WCSharp.Api;

public static class MemoryHandlerTest
{
    public static int cylceCount = 0;
    private static timer t = timer.Create();
    private static TestDestroyable[] KibbleTest = new TestDestroyable[2000];

    private class TestDestroyable : IDisposable
    {
        public string Name { get; set; }
        public int Count { get; set; }

        public void Dispose()
        {
            Name = "";
            Count = 0;
            ObjectPool<TestDestroyable>.ReturnObject(this);
        }
    }

    public static void SomeTest()
    {
        for (int i = 0; i < 2000; i++)
        {
            KibbleTest[i] = ObjectPool<TestDestroyable>.GetEmptyObject();
            KibbleTest[i].Name = "Kibble" + i;
            KibbleTest[i].Count = i;
        }

        for (int i = 0; i < 2000; i++)
        {
            KibbleTest[i].Dispose();
        }
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
            //ObjectPool.PrintDebugInfo();
        }));
    }
}
