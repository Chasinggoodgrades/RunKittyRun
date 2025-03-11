using System.Collections.Generic;
using WCSharp.Api;

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
        foreach (var player in PlayerNameTags)
        {
            // Splitting at the #
            var name = player.Key.Name.Split('#')[0];
            PlayerNameTags[player.Key].NameTag.SetText(name, NAME_TAG_HEIGHT);
            PlayerNameTags[player.Key].NameTag.SetPermanent(true);
            PlayerNameTags[player.Key].NameTag.SetColor(114, 188, 212, 255);
            PlayerNameTags[player.Key].NameTag.SetVisibility(true);
        }
    }

    private static void NamePosTimer()
    {
        NamePosUpdater.Start(NAME_TAG_UPDATE_INTERVAL, true, () =>
        {
            foreach (var player in PlayerNameTags)
            {
                var kitty = Globals.ALL_KITTIES[player.Key].Unit;
                PlayerNameTags[player.Key].UpdateNameTag();
                Blizzard.SetCameraQuickPositionForPlayer(player.Key, kitty.X, kitty.Y);
            }
        });
    }

    private void UpdateNameTag() => NameTag.SetPosition(Unit.Unit, NAME_TAG_HEIGHT);

    public static void HideAllNameTags(player Player)
    {
        if (!Player.IsLocal) return;
        foreach (var player in PlayerNameTags)
        {
            PlayerNameTags[player.Key].NameTag.SetVisibility(false);
            //NamedWolves.ShowWolfNames(false); (desync if wolves havent spawned yet)
        }
    }

    public static void ShowAllNameTags(player Player)
    {
        if (!Player.IsLocal) return;
        foreach (var player in PlayerNameTags)
        {
            PlayerNameTags[player.Key].NameTag.SetVisibility(true);
            //NamedWolves.ShowWolfNames(); (desync if wolves havent spawned yet)
        }
    }
}