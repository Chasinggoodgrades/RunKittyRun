using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


namespace Source.Game
{
    public static class RoundStart
    {

        public static void RoundActions()
        {
            Globals.ROUND += 1;
            Wolf.SpawnWolves();
            Globals.GAME_TIMER.
        }

    }
}
