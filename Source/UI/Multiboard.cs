using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public static class Multiboard
{
    public static void Initialize()
    {
        multiboard mb = CreateMultiboard();
        mb.Title = "Teams";
        mb.SetChildText("Team 1");
        mb.Rows = 5;
        mb.Columns = 2;
        mb.IsDisplayed = true;
        mb.GetItem(1, 1).SetWidth(4.0f);
        mb.GetItem(1, 1).SetText("Team 1");
    }

    public static void Update()
    {

    }
}
