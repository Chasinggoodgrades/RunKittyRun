using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class DiscordFrame
{
    private static framehandle EditBox;
    private static framehandle DiscordIconFront;
    private static framehandle DiscordIconBack;
    private static trigger Trigger;
    private static string Link = "https://discord.gg/GSu6zkNvx5";
    public static void Initialize()
    {
        BlzLoadTOCFile("war3mapImported\\templates.toc");
        EditBox = framehandle.Create("EscMenuEditBoxTemplate", originframetype.GameUI.GetOriginFrame(0), 0, 0);
        EditBox.SetAbsPoint(framepointtype.Center, 0.4f, 0.18f);
        EditBox.SetSize(0.20f, 0.03f);
        EditBox.TextSizeLimit = Link.Length;
        EditBox.Text = Link;
        RegisterTrigger();
        SetupDiscordIcon();
    }

    private static void SetupDiscordIcon()
    {
        DiscordIconFront = framehandle.Create("BACKDROP", "FrameDiscordIconFront", originframetype.GameUI.GetOriginFrame(0), "", 1);
        DiscordIconFront.SetAbsPoint(framepointtype.Center, 0.29f, 0.18f);
        DiscordIconFront.SetSize(0.03f, 0.03f);
        DiscordIconFront.SetTexture("war3mapImported\\DiscordIcon.dds", 0, true);

        DiscordIconBack = framehandle.Create("BACKDROP", "FrameDiscordIconBack", originframetype.GameUI.GetOriginFrame(0), "", 1);
        DiscordIconBack.SetAbsPoint(framepointtype.Center, 0.51f, 0.18f);
        DiscordIconBack.SetSize(0.03f, 0.03f);
        DiscordIconBack.SetTexture("war3mapImported\\DiscordIcon.dds", 0, true);
    }

    private static void RegisterTrigger()
    {
        Trigger = trigger.Create();
        Trigger.RegisterFrameEvent(EditBox, frameeventtype.EditBoxEnter);
        Trigger.AddAction(UpdateTextBox);
    }

    private static void UpdateTextBox()
    {
        if (!@event.Player.IsLocal) return; 
        EditBox.Text = Link;
    }

}