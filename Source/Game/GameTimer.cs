using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public static class GameTimer
{

    public static void Initialize()
    {
        TimerDialogSetTitle(Globals.GAME_TIMER_DIALOG, "Elapsed Game Time");
        timer t = CreateTimer();
        TimerStart(t, 1.0f, true, () => { StartGameTimer(); });
    }

    private static void StartGameTimer()
    {
        if (Globals.GAME_ACTIVE)
        {
            Globals.GAME_SECONDS += 1.0f;
            Globals.GAME_TIMER.Start(Globals.GAME_SECONDS, false, null);
            Globals.GAME_TIMER.Pause();
        }
    }
}