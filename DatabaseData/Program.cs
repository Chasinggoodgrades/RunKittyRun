using System.Text.RegularExpressions;

namespace CommandExtractor
{
    class Program
    {
        public static void Main()
        {
            Console.WriteLine("[POOL STRESS TEST STARTED]");
            const int timerAllocCount = 5000;
            const int enemyAllocCount = 3000;
            const int listAllocCount = 1000;

            var timerInstances = new TimerHandle[timerAllocCount];
            var enemyInstances = new Enemy[enemyAllocCount];
            var listInstances = new List<TimerHandle>[listAllocCount];

            int timerReuse = 0;
            int enemyReuse = 0;
            int listReuse = 0;

            // Allocate timers
            for (int i = 0; i < timerAllocCount; i++)
            {
                var timer = ObjectPool<TimerHandle>.Get();
                timer.Duration = i * 0.01f;
                timer.IsPaused = i % 5 == 0;
                timerInstances[i] = timer;

                if (ObjectPool<TimerHandle>.Count > 0) timerReuse++;
            }

            // Release half of them
            for (int i = 0; i < timerAllocCount; i += 2)
            {
                ObjectPool<TimerHandle>.Return(timerInstances[i]);
            }

            // Allocate enemies
            for (int i = 0; i < enemyAllocCount; i++)
            {
                var enemy = ObjectPool<Enemy>.Get();
                enemy.Health = 100 - (i % 100);
                enemy.X = i * 0.5f;
                enemy.Y = i * 0.3f;
                enemyInstances[i] = enemy;

                if (ObjectPool<Enemy>.Count > 0) enemyReuse++;
            }

            // Release most of them
            for (int i = 0; i < enemyAllocCount; i += 3)
            {
                ObjectPool<Enemy>.Return(enemyInstances[i]);
            }

            // Allocate and return lists
            for (int i = 0; i < listAllocCount; i++)
            {
                var list = ListPool<TimerHandle>.Get();
                list.Add(new TimerHandle { Duration = i, IsPaused = false });
                listInstances[i] = list;

                if (ListPool<TimerHandle>.Count > 0) listReuse++;
            }

            for (int i = 0; i < listAllocCount; i += 4)
            {
                ListPool<TimerHandle>.Return(listInstances[i]);
            }

            // Summary
            Console.WriteLine("\n[POOL SUMMARY]");
            Console.WriteLine($"TimerHandle reuse count: {timerReuse}");
            Console.WriteLine($"TimerHandle pool size: {ObjectPool<TimerHandle>.Count}");

            Console.WriteLine($"Enemy reuse count: {enemyReuse}");
            Console.WriteLine($"Enemy pool size: {ObjectPool<Enemy>.Count}");

            Console.WriteLine($"List<TimerHandle> reuse count: {listReuse}");
            Console.WriteLine($"List<TimerHandle> pool size: {ListPool<TimerHandle>.Count}");

            Console.WriteLine("[POOL STRESS TEST COMPLETE]");
        }
    }
}
