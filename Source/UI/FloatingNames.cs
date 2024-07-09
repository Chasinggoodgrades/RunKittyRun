using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared.Data;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class FloatingNameTag
{
    private static Dictionary<player, FloatingNameTag> PlayerNameTags;
    private static float NAME_TAG_HEIGHT = 0.015f;
    private static timer NamePosUpdater;
    private player Player;
    public texttag NameTag;
    private Kitty Unit;

    public FloatingNameTag(player player)
    {
        Player = player;
        NameTag = CreateTextTag();
        Unit = Globals.ALL_KITTIES[Player];
    }

    public static void Initialize()
    {
        PlayerNameTags = new Dictionary<player, FloatingNameTag>();
        NamePosUpdater = CreateTimer();
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

    private static void SetNameTagAttributes()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            // Name should be up till the #
            var name = player.Name.Split('#')[0];
            PlayerNameTags[player].NameTag.SetText(name, NAME_TAG_HEIGHT);
            PlayerNameTags[player].NameTag.SetPermanent(true);
            PlayerNameTags[player].NameTag.SetColor(114, 188, 212, 255);
            PlayerNameTags[player].NameTag.SetVisibility(true);
        }
    }

    private static void NamePosTimer()
    {
        NamePosUpdater.Start(0.02f, true, () =>
        {
            foreach (var player in Globals.ALL_PLAYERS)
            {
                PlayerNameTags[player].UpdateNameTag();
            }
        });
    }

    private void UpdateNameTag()
    {
        NameTag.SetPosition(Unit.Unit, NAME_TAG_HEIGHT);
    }
}