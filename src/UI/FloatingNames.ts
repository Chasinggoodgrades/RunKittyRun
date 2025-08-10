class FloatingNameTag {
    private NAME_TAG_HEIGHT: number = 0.015
    private NAME_TAG_UPDATE_INTERVAL: number = 0.03
    private NamePosUpdater: AchesTimers
    public Kitty: Kitty
    public NameTag: texttag

    public FloatingNameTag(kitty: Kitty) {
        Kitty = kitty
        NameTag = texttag.Create()
        Initialize()
    }

    public Initialize() {
        NamePosUpdater = ObjectPool.GetEmptyObject<AchesTimers>()
        SetNameTagAttributes()
        NamePosTimer()
    }

    public Dispose() {
        NameTag?.SetVisibility(false)
        NameTag?.Dispose()
        NamePosUpdater?.Dispose()
    }

    private SetNameTagAttributes() {
        NameTag.SetText(Kitty.Name, NAME_TAG_HEIGHT)
        NameTag.SetPermanent(true)
        NameTag.SetColor(114, 188, 212, 255)
        NameTag.SetVisibility(true)
    }

    private NamePosTimer() {
        NamePosUpdater.Timer.Start(NAME_TAG_UPDATE_INTERVAL, true, () => {
            UpdateNameTag()
            Blizzard.SetCameraQuickPositionForPlayer(Kitty.Player, Kitty.Unit.X, Kitty.Unit.Y)
        })
    }

    private UpdateNameTag() {
        return NameTag.SetPosition(Kitty.Unit, NAME_TAG_HEIGHT)
    }

    public static ShowAllNameTags(Player: player, shown: boolean) {
        if (!Player.IsLocal) return
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++) {
            let k = Globals.ALL_KITTIES_LIST[i]
            k.NameTag.NameTag.SetVisibility(shown)
        }
    }
}
