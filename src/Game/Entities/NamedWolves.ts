export class NamedWolves {
    public static DNTNamedWolves: Wolf[] = []
    public static ExplodingWolf: Wolf
    public static StanWolf: Wolf
    public STAN_NAME: string = '{Colors.COLOR_PURPLE}Stan|r'
    private static ExplodingTexttagTimer = Timer.create()
    private static ExplodingWolfRevive = Timer.create()
    private static BLOOD_EFFECT_PATH: string = 'war3mapImported\\Bloodstrike.mdx'

    /// <summary>
    /// Creates the named Wolves Marco and Stan. Only works in Standard mode.
    /// </summary>
    public static CreateNamedWolves() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        DNTNamedWolves.clear()
        CreateStanWolf()
        CreateExplodingWolf()
    }

    private static CreateExplodingWolf() {
        let index = GetRandomInt(0, RegionList.WolfRegions.length - 1)
        ExplodingWolf = new Wolf(index)
        ExplodingWolf.Texttag.SetPermanent(true)
        ExplodingTexttagTimer.start(0.03, true, UpdateTextTag)
        ExplodingWolfDesc()
    }

    private static UpdateTextTag() {
        ExplodingWolf?.Texttag?.setPos(ExplodingWolf.Unit.X, ExplodingWolf.unit.y, 0.015)
    }

    private static CreateStanWolf() {
        let index = GetRandomInt(0, RegionList.WolfRegions.length - 1)
        StanWolf = new Wolf(index)

        StanWolf.PauseSelf(true)
        StanWolf.Unit.SetVertexColor(235, 115, 255)
        StanWolf.Unit.Name = STAN_NAME
        StanWolf.OVERHEAD_EFFECT_PATH = ''

        StanWolf.Texttag ??= TextTag.create()!
        StanWolf.Texttag.setText(StanWolf.Unit.Name, 0.015)
        StanWolf.Texttag.SetPermanent(true)
        StanWolf.IsPaused = true
        StanWolf.Unit.IsInvulnerable = false

        Utility.SimpleTimer(0.5, () => (StanWolf.Unit.IsInvulnerable = false))
        BurntMeat.RegisterDeathTrigger()

        Utility.SimpleTimer(0.5, () => StanWolf.Texttag.setPos(StanWolf.Unit.X, StanWolf.unit.y, 0.015))
        DNTNamedWolves.push(StanWolf)
    }

    public static KillExplodingWolf() {
        try {
            if (ExplodingWolf.IsReviving) return
            ExplodingWolf.Unit.Kill()
            ExplodingWolf.IsReviving = true
            ExplodingWolf.OVERHEAD_EFFECT_PATH = ''
            ExplodingWolf.Texttag.setText('', 0.015)
            Utility.CreateEffectAndDisposeAttach(BLOOD_EFFECT_PATH, ExplodingWolf.Unit, 'origin')
            ExplodingWolfRevive.start(
                25.0,
                false,
                ErrorHandler.Wrap(() => {
                    if (ExplodingWolf.Unit == null) return
                    DNTNamedWolves.Remove(ExplodingWolf)
                    ExplodingWolf.IsReviving = false
                    ExplodingWolf.Unit?.Dispose()
                    Globals.ALL_WOLVES.Remove(ExplodingWolf.Unit)
                    ExplodingWolf.Unit = unit.Create(
                        ExplodingWolf.Unit.Owner,
                        Wolf.WOLF_MODEL,
                        ExplodingWolf.Unit.X,
                        ExplodingWolf.unit.y,
                        360
                    )
                    Globals.ALL_WOLVES.push(ExplodingWolf.Unit, ExplodingWolf)
                    ExplodingWolfDesc()
                })
            )
        } catch (e) {
            Logger.Warning('Error in KillExplodingWolf {e.Message}')
        }
    }

    private static ExplodingTexttag() {
        ExplodingWolf.Texttag ??= TextTag.create()!
        ExplodingWolf.Texttag.setText(ExplodingWolf.Unit.Name, 0.015)
    }

    private static ExplodingWolfDesc() {
        try {
            Utility.MakeUnitLocust(ExplodingWolf.Unit)
            let randomPlayer = GetRandomPlayerFromLobby()
            SetRandomVertexColor(ExplodingWolf.Unit, randomPlayer.Id)
            ExplodingWolf.Unit.Name = Utility.FormattedColorPlayerName(randomPlayer)
            ExplodingTexttag()
            ExplodingWolf.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT
            DNTNamedWolves.push(ExplodingWolf)
        } catch (e) {
            Logger.Warning('Error in ExplodingWolfDesc {e.Message} {e.StackTrace}')
        }
    }

    public static ExplodingWolfCollision(unit: Unit, k: Kitty, shadowKitty: boolean = false) {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return false
        if (unit != ExplodingWolf.Unit) return false
        if (!shadowKitty) Utility.GiveGoldFloatingText(25, k.Unit)
        else Utility.GiveGoldFloatingText(25, k.ShadowKitty.Unit)
        BurntMeat.FlamesDropChance(k)
        KillExplodingWolf()
        return true
    }

    private static GetRandomPlayerFromLobby(): MapPlayer {
        return Globals.ALL_PLAYERS[GetRandomInt(0, Globals.ALL_PLAYERS.length - 1)]
    }

    private static SetRandomVertexColor(u: Unit, playerID: number) {
        Colors.SetUnitToVertexColor(u, playerID)
    }
}
