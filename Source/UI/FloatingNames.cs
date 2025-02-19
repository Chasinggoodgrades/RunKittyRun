using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class FloatingNameTag
{
    public static Dictionary<player, FloatingNameTag> PlayerNameTags;
    private static float NAME_TAG_HEIGHT = 0.015f;
    private static float NAME_TAG_UPDATE_INTERVAL = 0.03f;
    private static timer NamePosUpdater;
    private player Player;
    public texttag NameTag;
    private Kitty Unit;

    public FloatingNameTag(player player)
    {
        Player = player;
        NameTag = texttag.Create();
        Unit = Globals.ALL_KITTIES[Player];
    }

    public static void Initialize()
    {
        PlayerNameTags = new Dictionary<player, FloatingNameTag>();
        NamePosUpdater = timer.Create();
        CreateNameTags();
        SetNameTagAttributes();
        NamePosTimer();
    }

    private static void CreateNameTags()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            PlayerNameTags[player] = new FloatingNameTag(player);
        }
    }

    public void Dispose()
    {
        NameTag.SetVisibility(false);
        NameTag.Dispose();
    }

    private static void SetNameTagAttributes()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            // Splitting at the #
            var name = player.Name.Split('#')[0];
            PlayerNameTags[player].NameTag.SetText(name, NAME_TAG_HEIGHT);
            PlayerNameTags[player].NameTag.SetPermanent(true);
            PlayerNameTags[player].NameTag.SetColor(114, 188, 212, 255);
            PlayerNameTags[player].NameTag.SetVisibility(true);
        }
    }

    private static void NamePosTimer()
    {
        NamePosUpdater.Start(NAME_TAG_UPDATE_INTERVAL, true, () =>
        {
            foreach (var player in Globals.ALL_PLAYERS)
            {
                var kitty = Globals.ALL_KITTIES[player].Unit;
                PlayerNameTags[player].UpdateNameTag();
                if (player.IsLocal) SetCameraQuickPosition(kitty.X, kitty.Y); // Spacebar 
            }
        });
    }

    private void UpdateNameTag() => NameTag.SetPosition(Unit.Unit, NAME_TAG_HEIGHT);

    public static void HideAllNameTags(player Player)
    {
        if (!Player.IsLocal) return;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            PlayerNameTags[player].NameTag.SetVisibility(false);
            NamedWolves.ShowWolfNames(false);
        }
    }

    public static void ShowAllNameTags(player Player)
    {
        if(!Player.IsLocal) return;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            PlayerNameTags[player].NameTag.SetVisibility(true);
            NamedWolves.ShowWolfNames(true);
        }
    }
}