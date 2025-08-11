

class FirstPersonCamera
{
    private timerPeriod: number = 0.001;
    private FIRSTPERSON_ANGLE_PER_PERIOD: number = 0.3;

    private forceCamTimer: timer;
    private hero: unit;
    private player: player;
    private Dictionary<string, bool> keyDownState;
    private lastUnitAnimation: string;

    public FirstPersonCamera(hero: unit, player: player)
    {
        this.hero = hero;
        this.player = player;
        this.keyDownState = new Dictionary<string, bool>
        {
            { "UP", false },
            { "DOWN", false },
            { "LEFT", false },
            { "RIGHT", false }
        };
    }

    public IsFirstPerson(): boolean  { return forceCamTimer != null; }

    public ToggleFirstPerson(active: boolean)
    {
        if (active)
        {
            if (forceCamTimer == null)
            {
                forceCamTimer = CreateTimer();
                TimerStart(forceCamTimer, timerPeriod, true, ErrorHandler.Wrap(UpdateCamera));
            }
        }
        else
        {
            if (forceCamTimer != null)
            {
                forceCamTimer.Pause();
                DestroyTimer(forceCamTimer);
                forceCamTimer = null;
                ResetCamera();
            }
        }
    }

    private UpdateCamera()
    {
        if (hero == null || !hero.Alive) return;

        let fwd: number = 0;

        if (!(keyDownState["LEFT"] && keyDownState["RIGHT"]) && (keyDownState["LEFT"] || keyDownState["RIGHT"]))
        {
            let angle: number = GetUnitFacing(hero);
            if (keyDownState["LEFT"]) angle += FIRSTPERSON_ANGLE_PER_PERIOD;
            if (keyDownState["RIGHT"]) angle -= FIRSTPERSON_ANGLE_PER_PERIOD;
            BlzSetUnitFacingEx(hero, angle);
        }

        if (!(keyDownState["UP"] && keyDownState["DOWN"]) && (keyDownState["UP"] || keyDownState["DOWN"]))
        {
            let moveSpeed: number = GetUnitMoveSpeed(hero);
            let movePerTick: number = moveSpeed * timerPeriod;

            let kitty: Kitty = Globals.ALL_KITTIES[player];

            if (kitty.Slider.IsEnabled())
            {
                movePerTick = 0.2;
            }

            let angle: number = Rad2Deg(GetUnitFacing(hero));
            if (keyDownState["UP"]) fwd += movePerTick;
            if (keyDownState["DOWN"]) fwd -= movePerTick;

            let oldX: number = GetUnitX(hero);
            let oldY: number = GetUnitY(hero);

            let newX: number = oldX + (fwd * Cos(angle));
            let newY: number = oldY + (fwd * Sin(angle));

            if (!Globals.GAME_ACTIVE && Regions.BarrierRegion.Contains(newX, newY))
            {
                return;
            }

            if (IsTerrainPathable(newX, oldY, PATHING_TYPE_WALKABILITY))
            {
                newX = oldX;
            }

            if (IsTerrainPathable(oldX, newY, PATHING_TYPE_WALKABILITY))
            {
                newY = oldY;
            }

            hero.SetPathing(false);
            SetUnitPosition(hero, newX, newY);
            hero.SetPathing(true);
        }

        if (fwd == 0)
        {
            if (this.lastUnitAnimation != "stand")
            {
                this.lastUnitAnimation = "stand";
                hero.SetAnimation(0); // 0 is stand for most units
            }
        }
        else
        {
            if (this.lastUnitAnimation != "walk")
            {
                this.lastUnitAnimation = "walk";
                hero.SetAnimation(6); // POTM is 6 for walk
            }
        }

        SetCameraTargetControllerNoZForPlayer(player, hero, 0, 0, true);
        SetCameraFieldForPlayer(player, CAMERA_FIELD_ANGLE_OF_ATTACK, 310, 0);
        SetCameraFieldForPlayer(player, CAMERA_FIELD_FIELD_OF_VIEW, 1500, 0);
        SetCameraFieldForPlayer(player, CAMERA_FIELD_ROTATION, GetUnitFacing(hero), 0);
        SetCameraFieldForPlayer(player, CAMERA_FIELD_ZOFFSET, 100, 0);

        ItemPickup();
    }

    public SetKeyDownState(key: string, state: boolean)
    {
        if (keyDownState.ContainsKey(key))
        {
            keyDownState[key] = state;
        }
    }

    private ResetCamera()
    {
        if (!player.IsLocal) return;
        SetCameraTargetControllerNoZForPlayer(player, hero, 0, 0, false);
        ResetToGameCamera(0);
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0, 0.0);
    }

    private ItemPickup()
    {
        let kitty: Kitty = Globals.ALL_KITTIES[player];
        ItemSpatialGrid.KittyItemPickup(kitty);
    }
}

class FirstPersonCameraManager
{
    private static  cameras : {[x: player]: FirstPersonCamera} = {}

    public static Initialize()
    {
        for (let player in Globals.ALL_PLAYERS)
        {
            let hero = GetHeroForPlayer(player);
            if (hero != null)
            {
                cameras[player] = new FirstPersonCamera(hero, player);
            }
        }

        RegisterKeyEvents();
    }

    private static RegisterKeyEvents()
    {
        let keyStates = new Dictionary<bool, int>
    {
        { true, bj_KEYEVENTTYPE_DEPRESS },
        { false, bj_KEYEVENTTYPE_RELEASE }
    };

        let keys = new Dictionary<string, int>
    {
        { "UP", bj_KEYEVENTKEY_UP },
        { "DOWN", bj_KEYEVENTKEY_DOWN },
        { "LEFT", bj_KEYEVENTKEY_LEFT },
        { "RIGHT", bj_KEYEVENTKEY_RIGHT }
    };

        for (let keyState in keyStates)
        {
            for (let key in keys)
            {
                for (let p in Globals.ALL_PLAYERS)
                {
                    let keyTrigger = CreateTrigger();
                    let localKey = key.Key; // Create a local copy of the key
                    let localValue = keyState.Key; // Create a local copy of the value
                    TriggerRegisterPlayerKeyEventBJ(keyTrigger, p, keyState.Value, key.Value);
                    TriggerAddAction(keyTrigger, () => OnKeyEvent(localKey, localValue));
                }
            }
        }
    }

    private static OnKeyEvent(key: string, isDown: boolean)
    {
        if (cameras.ContainsKey(GetTriggerPlayer()))
        {
            cameras[GetTriggerPlayer()].SetKeyDownState(key, isDown);
        }
    }

    private static GetHeroForPlayer: unit(player: player)
    {
        return Globals.ALL_KITTIES.ContainsKey(player) ? Globals.ALL_KITTIES[player].Unit : null;
    }

    public static ToggleFirstPerson(player: player)
    {
        if (cameras.ContainsKey(player))
        {
            cameras[player].ToggleFirstPerson(!cameras[player].IsFirstPerson());
        }
    }

    public static SetFirstPerson(player: player, active: boolean)
    {
        if (cameras.ContainsKey(player))
        {
            cameras[player].ToggleFirstPerson(active);
        }
    }
}
