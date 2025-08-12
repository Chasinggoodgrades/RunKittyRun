export class FloatingNameTag {
    private NAME_TAG_HEIGHT: number = 0.015
    private NAME_TAG_UPDATE_INTERVAL: number = 0.03
    private NamePosUpdater: AchesTimers
    public Kitty: Kitty
    public NameTag: texttag

    public FloatingNameTag(kitty: Kitty) {
        Kitty = kitty
        NameTag = TextTag.create()!
        Initialize()
    }

    public Initialize() {
        NamePosUpdater = MemoryHandler.getEmptyObject<AchesTimers>()
        SetNameTagAttributes()
        NamePosTimer()
    }

    public Dispose() {
        NameTag?.setVisible(false)
        NameTag?.Dispose()
        NamePosUpdater?.Dispose()
    }

    private SetNameTagAttributes() {
        NameTag.setText(Kitty.Name, NAME_TAG_HEIGHT)
        NameTag.SetPermanent(true)
        NameTag.setColor(114, 188, 212, 255)
        NameTag.setVisible(true)
    }

    private NamePosTimer() {
        NamePosUpdater.Timer.start(NAME_TAG_UPDATE_INTERVAL, true, () => {
            UpdateNameTag()
            SetCameraQuickPositionForPlayer(Kitty.Player, Kitty.Unit.X, Kitty.unit.y)
        })
    }

    private UpdateNameTag() {
        return NameTag.setPos(Kitty.Unit, NAME_TAG_HEIGHT)
    }

    public static ShowAllNameTags(Player: MapPlayer, shown: boolean) {
        if (!Player.isLocal()) return
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
            let k = Globals.ALL_KITTIES_LIST[i]
            k.NameTag.NameTag.setVisible(shown)
        }
    }
}
