import { Logger } from 'src/Events/Logger/Logger'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { RoundTimesData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RoundTimesData'
import { RewardHelper } from 'src/UI/Frames/RewardHelper'
import { Colors } from 'src/Utility/Colors/Colors'
import { MapPlayer } from 'w3ts'
import { GameStatsData } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameStatsData'
import { AwardManager } from '../Rewards/AwardManager'
import { BigNum, BigNumL } from './BigNum'
import { DecodeOldsave } from './DecodeOldsave'
import { OldSavesHelper } from './OldSavesHelper'
import { OldsaveSync } from './OldsaveSync'

export class Savecode {
    private static player_charset: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    private static OriginalToolTips: string[] = []
    public Digits = 0
    public Bignum: BigNum
    public static PlayerSaveObject: Map<MapPlayer, Savecode> = new Map()

    public static Initialize = () => {
        try {
            OldsaveSync.Initialize()
            for (let i = 0; i < OldSavesHelper.AbilityList.length; i++) {
                const ability = OldSavesHelper.AbilityList[i]
                const tooltip = BlzGetAbilityTooltip(ability, 0)
                if (tooltip && tooltip !== 'Tool tip missing!') Savecode.OriginalToolTips.push(tooltip)
                else throw new Error(`Error, tooltip not available: ${ability}`)
            }
            for (const player of Globals.ALL_PLAYERS) {
                Savecode.InitializeSaveCode(player)
            }
        } catch (e) {
            Logger.Critical(`Error in OldSaves.Initialize: ${e}`)
            throw e
        }
    }

    private static InitializeSaveCode = (p: MapPlayer) => {
        if (!Savecode.PlayerSaveObject.has(p)) {
            Savecode.PlayerSaveObject.set(p, new Savecode())
        }
    }

    public constructor() {
        this.Digits = 0.0
        this.Bignum = new BigNum(Savecode.BASE())
    }

    public Decode = (max: number) => {
        return this.Bignum.DivSmall(max + 1)
    }

    public Clean = () => {
        return this.Bignum.Clean()
    }

    public FromString = (s: string) => {
        let i = s.length - 1
        let cur = BigNumL.Create()
        this.Bignum.List = cur

        while (true) {
            cur.Leaf = OldSavesHelper.CharToInt(s[i])
            if (i <= 0) break
            cur.Next = BigNumL.Create()
            cur = cur.Next
            i--
        }
    }

    public Hash(): number {
        let hash = 0
        let x: number
        let current: BigNumL = this.Bignum.List

        while (!!current) {
            x = current.Leaf
            hash = OldSavesHelper.ModuloInteger(
                hash +
                    (79 * hash) / (x + 1) +
                    (293 * x) / (1 + hash - (hash / Savecode.BASE()) * Savecode.BASE()) +
                    479,
                Savecode.HASHN()
            )
            current = current.Next
        }

        return hash
    }

    public Obfuscate = (key: number, sign: number) => {
        const seed: number = GetRandomInt(0, math.maxinteger)
        let advance = 0
        let x = 0
        let current: BigNumL = this.Bignum.List

        if (sign === -1) {
            SetRandomSeed(this.Bignum.LastDigit())
            current.Leaf = Savecode.Modb(current.Leaf + sign * GetRandomInt(0, Savecode.BASE() - 1))
            x = current.Leaf
        }
        SetRandomSeed(key)

        while (!!current) {
            if (sign === -1) {
                advance = current.Leaf
            }

            current.Leaf = Savecode.Modb(current.Leaf + sign * GetRandomInt(0, Savecode.BASE() - 1))

            if (sign === 1) {
                advance = current.Leaf
            }

            advance += GetRandomInt(0, Savecode.BASE() - 1)
            SetRandomSeed(advance)

            x = current.Leaf
            current = current.Next
        }

        if (sign === 1) {
            SetRandomSeed(x)
            this.Bignum.List.Leaf = Savecode.Modb(this.Bignum.List.Leaf + sign * GetRandomInt(0, Savecode.BASE() - 1))
        }

        SetRandomSeed(seed)
    }

    public Load = (p: MapPlayer, code: string) => {
        try {
            const key: number = Savecode.SCommHash(p.name) + 1 * 73
            let inputhash = 0

            this.FromString(code)
            this.Obfuscate(key, -1)
            inputhash = this.Decode(Savecode.HASHN())
            this.Clean()

            return inputhash === this.Hash()
        } catch (e) {
            Logger.Critical(`Error in OldSaves.Load, save code must be from v4.2 or greater: ${e}`)
            return false
        }
    }

    public static LoadString = () => {
        if (CurrentGameMode.active !== GameMode.Standard) {
            print(`${Colors.COLOR_YELLOW}Old save codes only work in Standard`)
            return
        }

        const filePath = 'RunKittyRun\\SaveSlot_RKR.pld'
        let sb = []
        Preloader(filePath)

        for (let i = 0; i < OldSavesHelper.AbilityList.length; i++) {
            const abilityID = OldSavesHelper.AbilityList[i]
            const originalTooltip = Savecode.OriginalToolTips[i]

            const packet = BlzGetAbilityTooltip(abilityID, 0)
            if (packet === originalTooltip) break
            else {
                BlzSetAbilityTooltip(abilityID, originalTooltip, 0)
                sb.push(packet)
            }
        }
        let result = sb.join('')
        const newLineStart = result.indexOf('\n')
        if (newLineStart >= 0) result = result.substring(newLineStart + 1)

        sb = [result]
        OldsaveSync.SyncString(sb.join(''))
    }

    /// <summary>
    /// Method that is setting the values of rewards for the players.
    /// </summary>
    /// <param name="player"></param>
    public SetRewardValues = (player: MapPlayer) => {
        const awardData = Globals.ALL_KITTIES.get(player)!.SaveData.GameAwardsSorted
        const roundstats = Globals.ALL_KITTIES.get(player)!.SaveData.RoundTimes
        const kittyStats = Globals.ALL_KITTIES.get(player)!.SaveData.GameStats

        for (const value of DecodeOldsave.decodeValues) {
            const decodedValue = this.Decode(value.value)
            const propertyValue = RewardHelper.GetAwardNestedValueTwo(awardData, value.key)

            // Award Events
            if (propertyValue !== -1 && decodedValue === 1) {
                if (propertyValue === 0) {
                    AwardManager.GiveReward(player, value.key)
                    continue
                }
            }
            // Round Times
            if (value.key in roundstats) {
                if (
                    decodedValue < roundstats[value.key as keyof RoundTimesData] ||
                    roundstats[value.key as keyof RoundTimesData] === 0
                ) {
                    roundstats[value.key as keyof RoundTimesData] = decodedValue
                    continue
                }
            }
            // Game Stats
            if (value.key in kittyStats) {
                if (decodedValue > kittyStats[value.key as keyof GameStatsData]) {
                    kittyStats[value.key as keyof GameStatsData] = decodedValue
                    continue
                }
            }
        }
    }

    private static SCommHash = (name: string) => {
        const charlen = Savecode.player_charset.length
        const count: { [x: string]: number } = {}
        let x: number
        for (const c of name.toUpperCase()) {
            x = OldSavesHelper.Player_CharToInt(c)
            if (x >= 0) count[x]++
        }

        x = 0
        for (let i = 0; i < charlen; i++) x = count[i] * count[i] * i + count[i] * x + x + 199

        if (x < 0) x = -x

        return x
    }

    private static BASE(): number {
        return OldSavesHelper.charset.length
    }

    private static HASHN(): number {
        return 5000
    }

    private static Modb = (x: number) => {
        if (x >= Savecode.BASE()) return x - Savecode.BASE()
        else if (x < 0) return x + Savecode.BASE()
        return x
    }
}
