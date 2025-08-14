import { Logger } from 'src/Events/Logger/Logger'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { BurntMeat } from 'src/Rewards/EasterEggs/BurntMeat'
import { Colors } from 'src/Utility/Colors/Colors'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, TextTag, Timer, Unit } from 'w3ts'
import { Kitty } from './Kitty/Kitty'
import { Wolf } from './Wolf'

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
        NamedWolves.DNTNamedWolves.clear()
        NamedWolves.CreateStanWolf()
        NamedWolves.CreateExplodingWolf()
    }

    private static CreateExplodingWolf() {
        let index = GetRandomInt(0, RegionList.WolfRegions.length - 1)
        NamedWolves.ExplodingWolf = new Wolf(index)
        NamedWolves.ExplodingWolf.Texttag.setPermanent(true)
        NamedWolves.ExplodingTexttagTimer.start(0.03, true, NamedWolves.UpdateTextTag)
        NamedWolves.ExplodingWolfDesc()
    }

    private static UpdateTextTag() {
        NamedWolves.ExplodingWolf?.Texttag?.setPos(
            NamedWolves.ExplodingWolf.Unit.x,
            NamedWolves.ExplodingWolf.unit.y,
            0.015
        )
    }

    private static CreateStanWolf() {
        let index = GetRandomInt(0, RegionList.WolfRegions.length - 1)
        NamedWolves.StanWolf = new Wolf(index)

        NamedWolves.StanWolf.PauseSelf(true)
        NamedWolves.StanWolf.Unit.setVertexColor(235, 115, 255, 255)
        NamedWolves.StanWolf.Unit.name = STAN_NAME
        NamedWolves.StanWolf.OVERHEAD_EFFECT_PATH = ''

        NamedWolves.StanWolf.Texttag ??= TextTag.create()!
        NamedWolves.StanWolf.Texttag.setText(NamedWolves.StanWolf.Unit.name, 0.015)
        NamedWolves.StanWolf.Texttag.setPermanent(true)
        NamedWolves.StanWolf.paused = true
        NamedWolves.StanWolf.Unit.invulnerable = false

        Utility.SimpleTimer(0.5, () => (NamedWolves.StanWolf.Unit.invulnerable = false))
        BurntMeat.RegisterDeathTrigger()

        Utility.SimpleTimer(0.5, () =>
            NamedWolves.StanWolf.Texttag.setPos(NamedWolves.StanWolf.Unit.x, NamedWolves.StanWolf.unit.y, 0.015)
        )
        NamedWolves.DNTNamedWolves.push(NamedWolves.StanWolf)
    }

    public static KillExplodingWolf() {
        try {
            if (NamedWolves.ExplodingWolf.IsReviving) return
            NamedWolves.ExplodingWolf.Unit.Kill()
            NamedWolves.ExplodingWolf.IsReviving = true
            NamedWolves.ExplodingWolf.OVERHEAD_EFFECT_PATH = ''
            NamedWolves.ExplodingWolf.Texttag.setText('', 0.015)
            Utility.CreateEffectAndDisposeAttach(
                NamedWolves.BLOOD_EFFECT_PATH,
                NamedWolves.ExplodingWolf.Unit,
                'origin'
            )
            NamedWolves.ExplodingWolfRevive.start(
                25.0,
                false,
                ErrorHandler.Wrap(() => {
                    if (NamedWolves.ExplodingWolf.Unit == null) return
                    NamedWolves.DNTNamedWolves.Remove(NamedWolves.ExplodingWolf)
                    NamedWolves.ExplodingWolf.IsReviving = false
                    NamedWolves.ExplodingWolf.Unit?.dispose()
                    Globals.ALL_WOLVES.Remove(NamedWolves.ExplodingWolf.Unit)
                    NamedWolves.ExplodingWolf.Unit = Unit.create(
                        NamedWolves.ExplodingWolf.Unit.owner,
                        Wolf.WOLF_MODEL,
                        NamedWolves.ExplodingWolf.Unit.x,
                        NamedWolves.ExplodingWolf.unit.y,
                        360
                    )
                    Globals.ALL_WOLVES.push(NamedWolves.ExplodingWolf.Unit, NamedWolves.ExplodingWolf)
                    NamedWolves.ExplodingWolfDesc()
                })
            )
        } catch (e: any) {
            Logger.Warning('Error in KillExplodingWolf {e.Message}')
        }
    }

    private static ExplodingTexttag() {
        NamedWolves.ExplodingWolf.Texttag ??= TextTag.create()!
        NamedWolves.ExplodingWolf.Texttag.setText(NamedWolves.ExplodingWolf.Unit.name, 0.015)
    }

    private static ExplodingWolfDesc() {
        try {
            Utility.MakeUnitLocust(NamedWolves.ExplodingWolf.Unit)
            let randomPlayer = NamedWolves.GetRandomPlayerFromLobby()
            NamedWolves.SetRandomVertexColor(NamedWolves.ExplodingWolf.Unit, randomPlayer.id)
            NamedWolves.ExplodingWolf.Unit.name = Utility.FormattedColorPlayerName(randomPlayer)
            NamedWolves.ExplodingTexttag()
            NamedWolves.ExplodingWolf.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT
            NamedWolves.DNTNamedWolves.push(NamedWolves.ExplodingWolf)
        } catch (e: any) {
            Logger.Warning('Error in ExplodingWolfDesc {e.Message} {e.StackTrace}')
        }
    }

    public static ExplodingWolfCollision(unit: Unit, k: Kitty, shadowKitty: boolean = false) {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return false
        if (unit != NamedWolves.ExplodingWolf.Unit) return false
        if (!shadowKitty) Utility.GiveGoldFloatingText(25, k.Unit)
        else Utility.GiveGoldFloatingText(25, k.ShadowKitty.Unit)
        BurntMeat.FlamesDropChance(k)
        NamedWolves.KillExplodingWolf()
        return true
    }

    private static GetRandomPlayerFromLobby(): MapPlayer {
        return Globals.ALL_PLAYERS[GetRandomInt(0, Globals.ALL_PLAYERS.length - 1)]
    }

    private static SetRandomVertexColor(u: Unit, playerID: number) {
        Colors.SetUnitToVertexColor(u, playerID)
    }
}
