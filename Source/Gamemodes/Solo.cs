using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;



public static class Solo
{
    public static void Initialize()
    {
        Console.WriteLine($"{Colors.COLOR_YELLOW}Solo Mode may still have several bugs. Report as you come across :)|r");
        ItemSpawner.NUMBER_OF_ITEMS = 8;
    }


}
