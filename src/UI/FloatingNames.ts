import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Globals } from 'src/Global/Globals'
import { AchesTimers, createAchesTimer } from 'src/Utility/MemoryHandler/AchesTimers'
import { MapPlayer, TextTag } from 'w3ts'

export class FloatingNameTag {
    private NAME_TAG_HEIGHT: number = 0.015
    private NAME_TAG_UPDATE_INTERVAL: number = 0.03
    private NamePosUpdater: AchesTimers
    public Kitty: Kitty
    public NameTag: TextTag

    constructor(kitty: Kitty) {
        this.Kitty = kitty
        this.NameTag = TextTag.create()!
        this.Initialize()
    }

    public Initialize() {
        this.NamePosUpdater = createAchesTimer()
        this.SetNameTagAttributes()
        this.NamePosTimer()
    }

    public dispose() {
        this.NameTag?.setVisible(false)
        this.NameTag?.destroy()
        this.NamePosUpdater?.dispose()
    }

    private SetNameTagAttributes() {
        this.NameTag.setText(this.Kitty.name, this.NAME_TAG_HEIGHT)
        this.NameTag.setPermanent(true)
        this.NameTag.setColor(114, 188, 212, 255)
        this.NameTag.setVisible(true)
    }

    private NamePosTimer() {
        this.NamePosUpdater.Timer.start(this.NAME_TAG_UPDATE_INTERVAL, true, () => {
            this.UpdateNameTag()
            SetCameraQuickPositionForPlayer(this.Kitty.Player.handle, this.Kitty.Unit.x, this.Kitty.Unit.y)
        })
    }

    private UpdateNameTag() {
        return this.NameTag.setPosUnit(this.Kitty.Unit, this.NAME_TAG_HEIGHT)
    }

    public static ShowAllNameTags(Player: MapPlayer, shown: boolean) {
        if (!Player.isLocal()) return
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
            let k = Globals.ALL_KITTIES_LIST[i]
            k.NameTag.NameTag.setVisible(shown)
        }
    }
}
