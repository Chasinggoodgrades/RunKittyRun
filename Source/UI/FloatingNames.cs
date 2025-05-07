using WCSharp.Api;

public class FloatingNameTag
{
    private const float NAME_TAG_HEIGHT = 0.015f;
    private const float NAME_TAG_UPDATE_INTERVAL = 0.03f;
    private AchesTimers NamePosUpdater;
    public Kitty Kitty;
    public texttag NameTag;

    public FloatingNameTag(Kitty kitty)
    {
        Kitty = kitty;
        NameTag = texttag.Create();
        Initialize();
    }

    public void Initialize()
    {
        NamePosUpdater = ObjectPool.GetEmptyObject<AchesTimers>();
        SetNameTagAttributes();
        NamePosTimer();
    }

    public void Dispose()
    {
        NameTag.SetVisibility(false);
        NameTag.Dispose();
        NamePosUpdater.Dispose();
    }

    private void SetNameTagAttributes()
    {
        NameTag.SetText(Kitty.Player.Name.Split('#')[0], NAME_TAG_HEIGHT);
        NameTag.SetPermanent(true);
        NameTag.SetColor(114, 188, 212, 255);
        NameTag.SetVisibility(true);
    }

    private void NamePosTimer()
    {
        NamePosUpdater.Timer.Start(NAME_TAG_UPDATE_INTERVAL, true, () =>
        {
            UpdateNameTag();
            Blizzard.SetCameraQuickPositionForPlayer(Kitty.Player, Kitty.Unit.X, Kitty.Unit.Y);
        });
    }

    private void UpdateNameTag() => NameTag.SetPosition(Kitty.Unit, NAME_TAG_HEIGHT);

    public static void ShowAllNameTags(player Player, bool shown)
    {
        if (!Player.IsLocal) return;
        foreach (var k in Globals.ALL_KITTIES)
        {
            k.Value.NameTag.NameTag.SetVisibility(shown);
        }
    }
}
