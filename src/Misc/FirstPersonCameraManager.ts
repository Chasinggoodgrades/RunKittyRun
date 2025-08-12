export class FirstPersonCamera {
    private timerPeriod: number = 0.001
    private FIRSTPERSON_ANGLE_PER_PERIOD: number = 0.3

    private forceCamTimer: Timer
    private hero: Unit
    private player: MapPlayer
    private keyDownState: Map<string, boolean>
    private lastUnitAnimation: string

    public FirstPersonCamera(hero: Unit, player: MapPlayer) {
        this.hero = hero
        this.player = player
        this.keyDownState = {
            UP: false,
            DOWN: false,
            LEFT: false,
            RIGHT: false,
        }
    }

    public IsFirstPerson(): boolean {
        return this.forceCamTimer != null
    }

    public ToggleFirstPerson(active: boolean) {
        if (active) {
            if (this.forceCamTimer == null) {
                this.forceCamTimer = Timer.create()
                TimerStart(this.forceCamTimer, this.timerPeriod, true, ErrorHandler.Wrap(UpdateCamera))
            }
        } else {
            if (this.forceCamTimer != null) {
                this.forceCamTimer.pause()
                DestroyTimer(this.forceCamTimer)
                this.ResetCamera()
            }
        }
    }

    private UpdateCamera() {
        if (this.hero == null || !this.hero.Alive) return

        let fwd: number = 0

        if (
            !(this.keyDownState['LEFT'] && this.keyDownState['RIGHT']) &&
            (this.keyDownState['LEFT'] || this.keyDownState['RIGHT'])
        ) {
            let angle: number = GetUnitFacing(this.hero)
            if (this.keyDownState['LEFT']) angle += this.FIRSTPERSON_ANGLE_PER_PERIOD
            if (this.keyDownState['RIGHT']) angle -= this.FIRSTPERSON_ANGLE_PER_PERIOD
            BlzSetUnitFacingEx(this.hero, angle)
        }

        if (
            !(this.keyDownState['UP'] && this.keyDownState['DOWN']) &&
            (this.keyDownState['UP'] || this.keyDownState['DOWN'])
        ) {
            let moveSpeed: number = GetUnitMoveSpeed(this.hero)
            let movePerTick: number = moveSpeed * timerPeriod

            let kitty: Kitty = Globals.ALL_KITTIES.get(player)

            if (kitty.Slider.IsEnabled()) {
                movePerTick = 0.2
            }

            let angle: number = Rad2Deg(GetUnitFacing(this.hero))
            if (this.keyDownState['UP']) fwd += movePerTick
            if (this.keyDownState['DOWN']) fwd -= movePerTick

            let oldX: number = this.hero.x
            let oldY: number = this.hero.y

            let newX: number = oldX + fwd * Cos(angle)
            let newY: number = oldY + fwd * Sin(angle)

            if (!Globals.GAME_ACTIVE && Regions.BarrierRegion.includes(newX, newY)) {
                return
            }

            if (IsTerrainPathable(newX, oldY, PATHING_TYPE_WALKABILITY)) {
                newX = oldX
            }

            if (IsTerrainPathable(oldX, newY, PATHING_TYPE_WALKABILITY)) {
                newY = oldY
            }

            this.hero.SetPathing(false)
            SetUnitPosition(this.hero, newX, newY)
            this.hero.SetPathing(true)
        }

        if (fwd == 0) {
            if (this.lastUnitAnimation != 'stand') {
                this.lastUnitAnimation = 'stand'
                hero.SetAnimation(0) // 0 is stand for most units
            }
        } else {
            if (this.lastUnitAnimation != 'walk') {
                this.lastUnitAnimation = 'walk'
                hero.SetAnimation(6) // POTM is 6 for walk
            }
        }

        SetCameraTargetControllerNoZForPlayer(player, hero, 0, 0, true)
        SetCameraFieldForPlayer(player, CAMERA_FIELD_ANGLE_OF_ATTACK, 310, 0)
        SetCameraFieldForPlayer(player, CAMERA_FIELD_FIELD_OF_VIEW, 1500, 0)
        SetCameraFieldForPlayer(player, CAMERA_FIELD_ROTATION, GetUnitFacing(hero), 0)
        SetCameraFieldForPlayer(player, CAMERA_FIELD_ZOFFSET, 100, 0)

        ItemPickup()
    }

    public SetKeyDownState(key: string, state: boolean) {
        if (keyDownState.has(key)) {
            keyDownState[key] = state
        }
    }

    private ResetCamera() {
        if (!player.isLocal()) return
        SetCameraTargetControllerNoZForPlayer(player, this.hero, 0, 0, false)
        ResetToGameCamera(0)
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0, 0.0)
    }

    private ItemPickup() {
        let kitty: Kitty = Globals.ALL_KITTIES.get(player)
        ItemSpatialGrid.KittyItemPickup(kitty)
    }
}

export class FirstPersonCameraManager {
    private static cameras: Map<player, FirstPersonCamera> = new Map()

    public static Initialize() {
        for (let player in Globals.ALL_PLAYERS) {
            let hero = GetHeroForPlayer(player)
            if (hero != null) {
                cameras[player] = new FirstPersonCamera(hero, player)
            }
        }

        RegisterKeyEvents()
    }

    private static RegisterKeyEvents() {
        let keyStates: Map<string, number> = {
            true: bj_KEYEVENTTYPE_DEPRESS,
            false: bj_KEYEVENTTYPE_RELEASE,
        }

        let keys: Map<string, number> = {
            UP: bj_KEYEVENTKEY_UP,
            DOWN: bj_KEYEVENTKEY_DOWN,
            LEFT: bj_KEYEVENTKEY_LEFT,
            RIGHT: bj_KEYEVENTKEY_RIGHT,
        }

        for (let keyState in keyStates) {
            for (let key in keys) {
                for (let p in Globals.ALL_PLAYERS) {
                    let keyTrigger = CreateTrigger()
                    let localKey = key.Key // Create a local copy of the key
                    let localValue = keyState.Key // Create a local copy of the value
                    TriggerRegisterPlayerKeyEventBJ(keyTrigger, p, keyState.Value, key.Value)
                    TriggerAddAction(keyTrigger, () => OnKeyEvent(localKey, localValue))
                }
            }
        }
    }

    private static OnKeyEvent(key: string, isDown: boolean) {
        if (cameras.has(GetTriggerPlayer())) {
            cameras[GetTriggerPlayer()].SetKeyDownState(key, isDown)
        }
    }

    private static GetHeroForPlayer(player: MapPlayer): Unit {
        return Globals.ALL_KITTIES.has(player) ? Globals.ALL_KITTIES.get(player).Unit : null
    }

    public static ToggleFirstPerson(player: MapPlayer) {
        if (cameras.has(player)) {
            cameras[player].ToggleFirstPerson(!cameras[player].IsFirstPerson())
        }
    }

    public static SetFirstPerson(player: MapPlayer, active: boolean) {
        if (cameras.has(player)) {
            cameras[player].ToggleFirstPerson(active)
        }
    }
}
