using WCSharp.Api;
using static WCSharp.Api.Common;
public static class OldsaveSync
{
    private const string SYNC_PREFIX = "S";
    private static trigger Trigger = trigger.Create();
    private static trigger VariableEvent = trigger.Create();
    private static string SaveLoadCode { get; set; }
    private static player SavePlayer { get; set; }
    public static float LoadEvent { get; set; }

    public static bool SyncString(string s)
    {
        return BlzSendSyncData(SYNC_PREFIX, s);
    }

    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            BlzTriggerRegisterPlayerSyncEvent(Trigger, player, SYNC_PREFIX, false);
        }
        Trigger.AddAction(() =>
        {
            SavePlayer = GetTriggerPlayer();
            SaveLoadCode = BlzGetTriggerSyncData();
            LoadActions();
        });
    }

    public static void LoadActions()
    {
        Savecode savecode = new Savecode();
        if (SaveLoadCode.Length < 1) return;
        if (!savecode.Load(SavePlayer, SaveLoadCode))
        {
            SavePlayer.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}The save code is invalid :(");
            return;
        }
        savecode.SetRewardValues(SavePlayer);
        MultiboardUtil.RefreshMultiboards();

    }
}