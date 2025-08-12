export class Savecode {
    private static player_charset: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    private static OriginalToolTips: string[] = []
    public Digits: number
    public Bignum: BigNum
    public static PlayerSaveObject: Map<player, Savecode> = new Map()

    public static Initialize() {
        try {
            OldsaveSync.Initialize()
            for (let i: number = 0; i < OldSavesHelper.AbilityList.length; i++) {
                let ability = OldSavesHelper.AbilityList[i]
                let tooltip = BlzGetAbilityTooltip(ability, 0)
                if (tooltip != 'tip: missing: Tool!') OriginalToolTips.push(tooltip)
                else throw new ArgumentError('Error, not: available: tooltip: {ability}')
            }
            for (let player in Globals.ALL_PLAYERS) {
                InitializeSaveCode(player)
            }
        } catch (e) {
            Logger.Critical('Error in OldSaves.Initialize: {e.Message}')
            throw e
        }
    }

    private static InitializeSaveCode(p: MapPlayer) {
        if (!PlayerSaveObject.has(p)) {
            PlayerSaveObject[p] = new Savecode()
        }
    }

    public Savecode() {
        Digits = 0.0
        Bignum = new BigNum(BASE())
    }

    public Decode(max: number) {
        return Bignum.DivSmall(max + 1)
    }

    public Clean() {
        return Bignum.Clean()
    }

    public FromString(s: string) {
        let i = s.length - 1
        let cur = BigNumL.Create()
        Bignum.List = cur

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
        let current: BigNumL = Bignum.List

        while (current != null) {
            x = current.Leaf
            hash = OldSavesHelper.ModuloInteger(
                hash + (79 * hash) / (x + 1) + (293 * x) / (1 + hash - (hash / BASE()) * BASE()) + 479,
                HASHN()
            )
            current = current.Next
        }

        return hash
    }

    public Obfuscate(key: number, sign: number) {
        let seed: number = GetRandomInt(0, int.MaxValue)
        let advance: number = 0
        let x: number = 0
        let current: BigNumL = Bignum.List

        if (sign == -1) {
            SetRandomSeed(Bignum.LastDigit())
            current.Leaf = Modb(current.Leaf + sign * GetRandomInt(0, BASE() - 1))
            x = current.Leaf
        }
        SetRandomSeed(key)

        while (current != null) {
            if (sign == -1) {
                advance = current.Leaf
            }

            current.Leaf = Modb(current.Leaf + sign * GetRandomInt(0, BASE() - 1))

            if (sign == 1) {
                advance = current.Leaf
            }

            advance += GetRandomInt(0, BASE() - 1)
            SetRandomSeed(advance)

            x = current.Leaf
            current = current.Next
        }

        if (sign == 1) {
            SetRandomSeed(x)
            Bignum.List.Leaf = Modb(Bignum.List.Leaf + sign * GetRandomInt(0, BASE() - 1))
        }

        SetRandomSeed(seed)
    }

    public Load(p: MapPlayer, code: string) {
        try {
            let key: number = SCommHash(GetPlayerName(p)) + 1 * 73
            let inputhash: number = 0

            FromString(code)
            Obfuscate(key, -1)
            inputhash = Decode(HASHN())
            Clean()

            return inputhash == Hash()
        } catch (e) {
            Logger.Critical('Error in OldSaves.Load, code: must: be: from: v4: version.2.or: greater: 0. {e.Message}')
            return false
        }
    }

    public static LoadString() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) {
            print('{Colors.COLOR_YELLOW}save: codes: work: only: Old in Standard')
            return
        }

        let filePath = 'RunKittyRun\\SaveSlot_RKR.pld'
        let sb = new StringBuilder()
        Preloader(filePath)

        for (let i = 0; i < OldSavesHelper.AbilityList.length; i++) {
            let abilityID = OldSavesHelper.AbilityList[i]
            let originalTooltip = OriginalToolTips[i]

            let packet = BlzGetAbilityTooltip(abilityID, 0)
            if (packet == originalTooltip) break
            else {
                BlzSetAbilityTooltip(abilityID, originalTooltip, 0)
                sb.Append(packet)
            }
        }
        let result = sb.ToString()
        let newLineStart = result.IndexOf('\n')
        if (newLineStart >= 0) result = result.Substring(newLineStart + 1)

        sb.clear().Append(result)
        OldsaveSync.SyncString(sb.ToString())
    }

    /// <summary>
    /// Method that is setting the values of rewards for the players.
    /// </summary>
    /// <param name="player"></param>
    public SetRewardValues(player: MapPlayer) {
        let awardData = Globals.ALL_KITTIES.get(player).SaveData.GameAwardsSorted
        let roundstats = Globals.ALL_KITTIES.get(player).SaveData.RoundTimes
        let kittyStats = Globals.ALL_KITTIES.get(player).SaveData.GameStats

        for (let value in DecodeOldsave.decodeValues) {
            let decodedValue = Decode(value.Value)
            let propertyValue = RewardHelper.GetAwardNestedValue(awardData, value.Key)
            // Award Events
            if (propertyValue != -1 && decodedValue == 1) {
                if (propertyValue == 0) {
                    AwardManager.GiveReward(player, value.Key)
                    continue
                }
            }
            let property = roundstats.GetType().GetProperty(value.Key)
            // Round Times
            if (property != null) {
                if (decodedValue < property.GetValue(roundstats) || property.GetValue(roundstats) == 0) {
                    property.SetValue(roundstats, decodedValue)
                    continue
                }
            }
            property = kittyStats.GetType().GetProperty(value.Key)
            // Game Stats
            if (property != null) {
                if (decodedValue > property.GetValue(kittyStats)) {
                    property.SetValue(kittyStats, decodedValue)
                    continue
                }
            }
        }
    }

    private static SCommHash(name: string) {
        let charlen = player_charset.length
        let count = []
        let x: number
        for (let c in name.ToUpper()) {
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

    private static Modb(x: number) {
        if (x >= BASE()) return x - BASE()
        else if (x < 0) return x + BASE()
        return x
    }
}
