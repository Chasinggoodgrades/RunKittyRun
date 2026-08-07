using WCSharp.Api;
using static WCSharp.Api.Common;

public static class PreventGameSave
{
    private static trigger Trigger = trigger.Create();
    private static dialog Dialog = dialog.Create();
    private static timer TImer = timer.Create();

    private static bool StopSave()
    {
        DialogDisplay(GetLocalPlayer(), Dialog, true);
        TImer.Start(0.0f, false, () => DialogDisplay(GetLocalPlayer(), Dialog, false));
        return true;
    }

    public static void Initialize()
    {
        Trigger.RegisterGameEvent(EVENT_GAME_SAVE);
        Trigger.AddCondition(Filter( () => StopSave()));
    }

}
