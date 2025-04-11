using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class FrameManager
{
    public static trigger StatsTrigger = trigger.Create();
    public static trigger ShopTrigger = trigger.Create();
    public static trigger RewardsTrigger = trigger.Create();
    public static framehandle MusicButton;
    public static framehandle ShopButton;
    public static framehandle RewardsButton;
    public static framehandle Backdrop;

    private const float ButtonWidth = 0.053f;
    private const float ButtonHeight = 0.028f;

    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static trigger ESCTrigger = trigger.Create();
    private static string TEXT_COLOR = Colors.COLOR_YELLOW;
    private static string HOTKEY_COLOR = Colors.COLOR_YELLOW_ORANGE;

    private static readonly Action _cachedUIPosition = RepositionBackdropAction();
    private static List<framehandle> _frames = new List<framehandle>();

    public static void Initialize()
    {
        try
        {
            BlzLoadTOCFile("war3mapImported\\templates.toc");
            RemoveUnwantedFrames();
            ButtonsBackdrop();
            CreateRewardsButton();
            CreateMusicButton();
            CreateShopButton();
            MusicFrame.Initialize();
            Utility.SimpleTimer(1.0f, ESCHideFrames);
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in FrameManager.Initialize: {ex.Message}");
            throw;
        }
    }

    public static void InitAllFrames()
    {
        ShopFrame.Initialize();
        RewardsFrame.Initialize();
        InitalizeButtons();
        InitFramesList();
    }

    public static void InitalizeButtons()
    {
        Backdrop.Visible = true;
        RewardsButton.Visible = true;
        MusicButton.Visible = true;
        ShopButton.Visible = true;
    }

    public static framehandle CreateHeaderFrame(framehandle parent)
    {
        var header = framehandle.Create("BACKDROP", $"{parent.Name}Header", parent, "QuestButtonDisabledBackdropTemplate", 0);
        var width = parent.Width;
        var height = 0.0225f;
        header.SetPoint(framepointtype.TopLeft, 0, 0.0125f, parent, framepointtype.TopLeft);
        header.SetSize(width, height);

        var title = framehandle.Create("TEXT", $"{parent.Name}Title", header, "ScriptDialogText", 0);
        title.SetPoint(framepointtype.Center, 0, 0, header, framepointtype.Center);
        title.SetSize(width, height);
        title.Text = $"{Colors.COLOR_YELLOW}{parent.Name}{Colors.COLOR_RESET}";
        title.SetTextAlignment(textaligntype.Center, textaligntype.Center);

        var closeButton = framehandle.Create("GLUETEXTBUTTON", $"{parent.Name}CloseButton", header, "ScriptDialogButton", 0);
        closeButton.SetPoint(framepointtype.TopRight, -0.0025f, -0.0025f, header, framepointtype.TopRight);
        closeButton.SetSize(height - 0.005f, height - 0.005f);
        closeButton.Text = "X";

        // Close Actions
        var closeTrigger = trigger.Create();
        closeTrigger.RegisterFrameEvent(closeButton, frameeventtype.Click);
        closeTrigger.AddAction(ErrorHandler.Wrap(() =>
        {
            if (!@event.Player.IsLocal) return;
            parent.Visible = false;
        }));

        return header;
    }

    private static void RemoveUnwantedFrames()
    {
        var resourceBarText = BlzGetFrameByName("ResourceBarSupplyText", 0);
        BlzFrameGetChild(BlzFrameGetChild(GameUI, 5), 0);
        resourceBarText.Text = "0:00";
        //timeDayDisplay.Visible = false;
    }

    private static void InitFramesList()
    {
        _frames.Add(ShopFrame.shopFrame);
        _frames.Add(RewardsFrame.RewardFrame);
        _frames.Add(MusicFrame.MusicFramehandle);
    }

    private static void CreateRewardsButton()
    {
        RewardsButton = framehandle.Create("GLUETEXTBUTTON", "RewardsButton", Backdrop, "ScriptDialogButton", 0);
        RewardsButton.SetPoint(framepointtype.Center, 0, 0, Backdrop, framepointtype.Center);
        RewardsButton.SetSize(ButtonWidth, ButtonHeight);
        var shopText = framehandle.Create("TEXT", "RewardsText", RewardsButton, "", 0);
        shopText.Text = $"{TEXT_COLOR}Rewards{HOTKEY_COLOR}(-)|r";
        shopText.SetPoint(framepointtype.Center, 0, 0, RewardsButton, framepointtype.Center);
        shopText.SetScale(0.9f);
        shopText.Enabled = false;
        RewardsTrigger.RegisterFrameEvent(RewardsButton, frameeventtype.Click);
        RewardsTrigger.AddAction(ErrorHandler.Wrap(RewardsFrame.RewardsFrameActions));
        RewardsButton.Visible = false;
    }

    private static void CreateMusicButton()
    {
        MusicButton = framehandle.Create("GLUETEXTBUTTON", "MusicButton", Backdrop, "ScriptDialogButton", 0);
        MusicButton.SetPoint(framepointtype.TopRight, 0, 0, RewardsButton, framepointtype.TopLeft);
        MusicButton.SetSize(ButtonWidth, ButtonHeight);
        var shopText = framehandle.Create("TEXT", "MusicText", MusicButton, "", 0);
        shopText.Text = $"{TEXT_COLOR}Music{HOTKEY_COLOR}(0)";
        shopText.SetPoint(framepointtype.Center, 0, 0, MusicButton, framepointtype.Center);
        shopText.SetScale(0.98f);
        shopText.Enabled = false;
        StatsTrigger.RegisterFrameEvent(MusicButton, frameeventtype.Click);
        StatsTrigger.AddAction(ErrorHandler.Wrap(MusicFrame.MusicFrameActions));
        MusicButton.Visible = false;
    }

    private static void CreateShopButton()
    {
        ShopButton = framehandle.Create("GLUETEXTBUTTON", "ShopButton", Backdrop, "ScriptDialogButton", 0);
        ShopButton.SetPoint(framepointtype.TopLeft, 0, 0, RewardsButton, framepointtype.TopRight);
        ShopButton.SetSize(ButtonWidth, ButtonHeight);
        var shopText = framehandle.Create("TEXT", "ShopText", ShopButton, "", 0);
        shopText.Text = $"{TEXT_COLOR}Shop{HOTKEY_COLOR}(=)";
        shopText.SetPoint(framepointtype.Center, 0, 0, ShopButton, framepointtype.Center);
        shopText.SetScale(1.0f);
        shopText.Enabled = false;
        ShopTrigger.RegisterFrameEvent(ShopButton, frameeventtype.Click);
        ShopTrigger.AddAction(ErrorHandler.Wrap(ShopFrame.ShopFrameActions));
        ShopButton.Visible = false;
    }

    private static void ButtonsBackdrop()
    {
        Backdrop = framehandle.Create("BACKDROP", "ButtonsBackdrop", GameUI, "QuestButtonDisabledBackdropTemplate", 0);
        BlzGetFrameByName("ResourceBarGoldText", 0);
        Backdrop.SetPoint(framepointtype.Top, 0, 0, GameUI, framepointtype.Top);
        Backdrop.SetSize(0.16f, 0.035f);
        Backdrop.SetScale(1.0f);
        Backdrop.Visible = false;
        RepositionBackdrop();
    }

    private static void RepositionBackdrop()
    {
        var t = timer.Create();
        var nameFrame = BlzGetFrameByName("ConsoleUIBackdrop", 0);

        t.Start(1.0f, true, _cachedUIPosition);
    }

    private static Action RepositionBackdropAction()
    {
        return () => {
            try
            {
                var nameFrame = BlzGetFrameByName("ConsoleUIBackdrop", 0);
                var x = nameFrame.Width / 4;
                var h = nameFrame.Height / 8;
                var yOffSet = nameFrame.Height / 8;
                Backdrop.SetPoint(framepointtype.Top, 0, yOffSet, nameFrame, framepointtype.Top);
                Backdrop.SetSize(x, h);
            }
            catch (Exception e)
            {
                Logger.Critical($"Error in RepositionBackdropAction: {e.Message}");
            }
        };
    }

    private static void ESCHideFrames()
    {
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var player = Globals.ALL_PLAYERS[i];
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        }
        ESCTrigger.AddAction(ErrorHandler.Wrap(ESCActions));
    }

    public static void RefreshFrame(framehandle frame)
    {
        frame.Visible = !frame.Visible;
        frame.Visible = !frame.Visible;
    }

    private static void ESCActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        RewardsFrame.RewardFrame.Visible = false;
        ShopFrame.shopFrame.Visible = false;
        MusicFrame.MusicFramehandle.Visible = false;
    }

    public static void HideOtherFrames(framehandle currentFrame)
    {
        for(int i = 0; i < _frames.Count; i++)
        {
            if (_frames[i] != currentFrame) _frames[i].Visible = false;
        }
    }
}
