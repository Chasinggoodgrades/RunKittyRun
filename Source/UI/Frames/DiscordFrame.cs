using WCSharp.Api;

public static class DiscordFrame
{
    private static framehandle EditBox;
    private static framehandle DiscordIconFront;
    private static framehandle DiscordIconBack;
    private static framehandle DiscordText;
    private static framehandle Backdrop;
    private static trigger Trigger;
    private static trigger ESCTrigger;
    private static string Link = "https://discord.gg/GSu6zkNvx5";
    private static string JoinDiscord = "|cffFF2020Join our discord! Highlight then Ctrl + C to copy, Ctrl + V to paste!|r";

    public static void Initialize()
    {
        //BlzLoadTOCFile("war3mapImported\\templates.toc");
        SetupBackdrop();
        CreateFrame();
        RegisterTrigger();
        SetupDiscordIcon();
        ApplyTextFrame();
        RegisterESCTrigger();
    }

    private static void CreateFrame()
    {
        EditBox = framehandle.Create("EscMenuEditBoxTemplate", originframetype.GameUI.GetOriginFrame(0), 0, 0);
        EditBox.SetAbsPoint(framepointtype.Center, 0.4f, 0.165f);
        EditBox.SetSize(0.20f, 0.03f);
        EditBox.TextSizeLimit = Link.Length;
        EditBox.Text = Link;
        EditBox.SetTextAlignment(textaligntype.Center, textaligntype.Center);
    }

    private static void SetupBackdrop()
    {
        Backdrop = framehandle.Create("BACKDROP", "DiscordBackDrop", originframetype.GameUI.GetOriginFrame(0), "QuestButtonDisabledBackdropTemplate", 0);
        Backdrop.SetAbsPoint(framepointtype.Center, 0.4f, 0.21f);
        Backdrop.SetSize(0.195f, 0.035f);
    }

    private static void SetupDiscordIcon()
    {
        DiscordIconFront = framehandle.Create("BACKDROP", "FrameDiscordIconFront", originframetype.GameUI.GetOriginFrame(0), "", 1);
        DiscordIconFront.SetAbsPoint(framepointtype.Center, 0.29f, 0.165f);
        DiscordIconFront.SetSize(0.03f, 0.03f);
        DiscordIconFront.SetTexture("war3mapImported\\DiscordIcon.dds", 0, true);

        DiscordIconBack = framehandle.Create("BACKDROP", "FrameDiscordIconBack", originframetype.GameUI.GetOriginFrame(0), "", 1);
        DiscordIconBack.SetAbsPoint(framepointtype.Center, 0.51f, 0.165f);
        DiscordIconBack.SetSize(0.03f, 0.03f);
        DiscordIconBack.SetTexture("war3mapImported\\DiscordIcon.dds", 0, true);
    }

    private static void ApplyTextFrame()
    {
        DiscordText = framehandle.Create("TEXT", "DiscordText", originframetype.GameUI.GetOriginFrame(0), "", 0);
        DiscordText.SetAbsPoint(framepointtype.Center, 0.4f, 0.21f);
        DiscordText.SetSize(0.19f, 0.03f);
        DiscordText.Text = JoinDiscord;
        DiscordText.SetTextAlignment(textaligntype.Center, textaligntype.Center);
    }

    private static void RegisterTrigger()
    {
        Trigger = trigger.Create();
        Trigger.RegisterFrameEvent(EditBox, frameeventtype.EditBoxEnter);
        Trigger.AddAction(UpdateTextBox);
    }

    private static void RegisterESCTrigger()
    {
        ESCTrigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        }
        ESCTrigger.AddAction(ESCPressed);
    }

    private static void ESCPressed()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        Backdrop.Visible = !Backdrop.Visible;
        EditBox.Visible = !EditBox.Visible;
        DiscordIconFront.Visible = !DiscordIconFront.Visible;
        DiscordIconBack.Visible = !DiscordIconBack.Visible;
        DiscordText.Visible = !DiscordText.Visible;
    }

    private static void UpdateTextBox()
    {
        if (!@event.Player.IsLocal) return;
        EditBox.Text = Link;
    }
}
