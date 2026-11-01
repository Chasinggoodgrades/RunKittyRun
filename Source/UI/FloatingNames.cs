using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class FloatingNameTag
{
    private const float NAME_TAG_HEIGHT = 0.015f;
    private const float NAME_TAG_UPDATE_INTERVAL = 0.03f;
    private AchesTimers NamePosUpdater;
    private readonly IFloatingTags Owner;
    public texttag NameTag;

    /// <summary>True while something else (the async stand-in effect) places the tag and drives the owner's camera.</summary>
    private bool isFollowingPoint;

    public FloatingNameTag(IFloatingTags owner)
    {
        Owner = owner;
        NameTag = texttag.Create();
        Initialize();
    }

    public void Initialize()
    {
        NamePosUpdater = ObjectPool<AchesTimers>.GetEmptyObject();
        SetNameTagAttributes();
        NamePosTimer();
    }

    public void Dispose()
    {
        NameTag?.SetVisibility(false);
        NameTag?.Dispose();
        NamePosUpdater?.Dispose();
    }

    private void SetNameTagAttributes()
    {
        NameTag.SetText(Owner.Name, NAME_TAG_HEIGHT);
        NameTag.SetPermanent(true);
        NameTag.SetColor(114, 188, 212, 255);
        NameTag.SetVisibility(true);
    }

    private void NamePosTimer()
    {
        try
        {
            NamePosUpdater.Timer.Start(NAME_TAG_UPDATE_INTERVAL, true, () =>
            {
                if (isFollowingPoint) return;

                UpdateNameTag();
                Blizzard.SetCameraQuickPositionForPlayer(Owner.Player, Owner.Unit.X, Owner.Unit.Y);
            });
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in FloatingNameTag.NamePosTimer: {e.Message}");
        }
    }

    private void UpdateNameTag() => NameTag.SetPosition(Owner.Unit, NAME_TAG_HEIGHT);

    /// <summary>
    /// Places the tag at a world point instead of on the unit, and keeps the owner's camera on it.
    /// Called every tick by KittyAsyncEffect so the tag and the camera move with the effect.
    /// Local only: the position differs from one machine to another and nothing synced reads it.
    /// </summary>
    public void FollowPoint(float x, float y)
    {
        isFollowingPoint = true;
        SetTextTagPos(NameTag, x, y, NAME_TAG_HEIGHT);

        if (Owner.Player.IsLocal)
        {
            Blizzard.SetCameraQuickPositionForPlayer(Owner.Player, x, y);
        }
    }

    /// <summary>Back to the unit: the regular timer places the tag and the camera again.</summary>
    public void FollowUnit() => isFollowingPoint = false;

    public static void ShowAllNameTags(player Player, bool shown)
    {
        if (!Player.IsLocal) return;
        for(int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
        {
            var k = Globals.ALL_KITTIES_LIST[i];
            k.NameTag.NameTag.SetVisibility(shown);
        }
    }
}
