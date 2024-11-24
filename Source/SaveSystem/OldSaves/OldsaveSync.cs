using System;
using WCSharp.Api;
using WCSharp.Sync;
using static WCSharp.Api.Common;
public static class OldsaveSync
{
    private const string SYNC_PREFIX = "S";
    private static trigger Trigger = trigger.Create();
    private static trigger VariableEvent = trigger.Create();
    public static string SaveLoadCode;
    public static player SavePlayer;
    public static float LoadEvent;
    
    public static bool SyncString(string s)
    {
        return BlzSendSyncData(SYNC_PREFIX, s);
    }

    public static triggeraction OnSyncString(Action func)
    {
        return Trigger.AddAction(func);
    }

    public static void RemoveSyncString(triggeraction t)
    {
        TriggerRemoveAction(Trigger, t);
    }

    public static void Initialize()
    {
        foreach(var player in Globals.ALL_PLAYERS)
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
        if(!savecode.Load(SavePlayer, SaveLoadCode))
        {
            SavePlayer.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}The save code is invalid :(");
            return;
        }


        savecode.SetRewardValues(SavePlayer);

    }



}