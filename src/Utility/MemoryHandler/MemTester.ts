

class MemoryHandlerTest
{
    public static cylceCount: number = 0;
    private static t: timer = timer.Create();
    private static  KibbleTest:TestDestroyable[] = new TestDestroyable[2000];

    private class TestDestroyable extends IDisposable
    {
        public Name: string 
        public Count: number 

        public Dispose()
        {
            Name = "";
            Count = 0;
            ObjectPool<TestDestroyable>.ReturnObject(this);
        }
    }

    public static SomeTest()
    {
        for (let i: number = 0; i < 2000; i++)
        {
            KibbleTest[i] = ObjectPool.GetEmptyObject<TestDestroyable>();
            KibbleTest[i].Name = "Kibble" + i;
            KibbleTest[i].Count = i;
        }

        for (let i: number = 0; i < 2000; i++)
        {
            KibbleTest[i].Dispose();
        }
    }

    public static PeriodicTest(on: boolean)
    {
        if (!on)
        {
            t.Pause();
            return;
        }
        t.Start(1.0, true, ErrorHandler.Wrap(() =>
        {
            //ObjectPool.PrintDebugInfo();
        }));
    }
}
