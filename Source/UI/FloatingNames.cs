using System;
using WCSharp.Api;

public class FloatingNameTag
{
    private const float NAME_TAG_HEIGHT = 0.015f;
    private const float NAME_TAG_UPDATE_INTERVAL = 0.03f;
    private AchesTimers NamePosUpdater;
    private readonly IFloatingTags Owner;
    public texttag NameTag;

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
