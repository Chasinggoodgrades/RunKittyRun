import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { DateTimeManager } from 'src/Seasonal/DateTimeManager'
import { Colors } from 'src/Utility/Colors/Colors'
import { Action } from 'src/Utility/CSUtils'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger } from 'w3ts'
import { EncodingBase64 } from './Base64'
import { KittyData, SetRewardsFromUnavailableToAvailable } from './MAKE REWARDS HERE/KittyData'
import { EncodingHex } from './SyncUtil/EncodingHex'

export class SaveManager {
    private syncSaveLoad: SyncSaveLoad
    private SavePath = 'Run-Kitty-Run'
    public static SaveData: Map<MapPlayer, KittyData | undefined> = new Map()
    public static PlayersLoaded: MapPlayer[] = []

    public constructor() {
        this.syncSaveLoad = SyncSaveLoad.getInstance()
        for (const player of Globals.ALL_PLAYERS) SaveManager.SaveData.set(player, undefined)
        this.LoadAll()
    }

    public static Initialize = () => {
        Globals.SaveSystem = new SaveManager()
    }

    public static SaveAll = () => {
        const date = DateTimeManager.GetStringDateFormat()
        for (const player of Globals.ALL_PLAYERS) {
            if (player.controller === MAP_CONTROL_COMPUTER) continue
            if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue
            const saveData = SaveManager.SaveData.get(player)
            if (!saveData) continue
            saveData.Date = date
            Globals.SaveSystem.Save(player)
        }
    }

    public Save = (player: MapPlayer) => {
        try {
            const date = DateTimeManager.GetStringDateFormat()
            const playerData = SaveManager.SaveData.get(player)
            if (!playerData) return
            playerData.Date = date
            if (!player.isLocal()) return
            this.syncSaveLoad.WriteFileObjects(`${this.SavePath}/${player.name}.txt`, playerData)
            player.DisplayTimedTextTo(4.0, `${Colors.COLOR_GOLD}Stats have been saved.${Colors.COLOR_RESET}`)
        } catch (e) {
            Logger.Critical(`${Colors.COLOR_DARK_RED}Error in SaveManager.Save: ${e}${Colors.COLOR_RESET}`)
            throw e
        }
    }

    private SaveAllDataToFile = (player: MapPlayer) => {
        try {
            if (!player.isLocal()) return
            this.syncSaveLoad.WriteFileObjects(`${this.SavePath}/AllSaveData.txt`)
        } catch (e) {
            Logger.Critical(`${Colors.COLOR_DARK_RED}Error in SaveManager.SaveAll: ${e}${Colors.COLOR_RESET}`)
            throw e
        }
    }

    public static SaveAllDataToFile = () => {
        const date = DateTimeManager.DateTime.toString()
        for (const player of Globals.ALL_PLAYERS) {
            if (player.controller === MAP_CONTROL_COMPUTER) continue
            if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue
            if (!SaveManager.SaveData.has(player) || !SaveManager.SaveData.get(player))
                Globals.SaveSystem.NewSave(player) // Ensure save data exists for this player before saving.
            const data = SaveManager.SaveData.get(player)
            if (!data) continue
            data.Date = date
            Globals.SaveSystem.SaveAllDataToFile(player)
        }
    }

    public Load = (player: MapPlayer) => {
        this.syncSaveLoad.Read(`${this.SavePath}/${player.name}.txt`, player, SaveManager.FinishLoading())
    }

    public LoadAll = () => {
        try {
            for (const player of Globals.ALL_PLAYERS) {
                if (player.controller === MAP_CONTROL_COMPUTER) continue
                if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue
                this.Load(player)
            }
        } catch (e) {
            Logger.Critical(`${Colors.COLOR_DARK_RED}Error in SaveManager.LoadAll: ${e}${Colors.COLOR_RESET}`)
            throw e
        }
    }

    private NewSave = (player: MapPlayer) => {
        try {
            if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) return
            SaveManager.SaveData.set(player, new KittyData())
            const saveData = SaveManager.SaveData.get(player)
            if (!saveData) return
            saveData.PlayerName = player.name
            if (!SaveManager.PlayersLoaded.includes(player)) SaveManager.PlayersLoaded.push(player)
            // if (!Gamemode.IsGameModeChosen) return
        } catch (e) {
            Logger.Critical(`${Colors.COLOR_DARK_RED}Error in SaveManager.NewSave: ${e} ${Colors.COLOR_RESET}`)
            throw e
        }
    }

    private static FinishLoading(): Action<FilePromise> {
        return promise => {
            const data = promise.DecodedString
            const player = promise.SyncOwner
            if (data.length < 1) {
                Globals.SaveSystem.NewSave(player)
                player.DisplayTimedTextTo(
                    5.0,
                    `${Colors.COLOR_YELLOW}No save found. Creating new save.${Colors.COLOR_RESET}`
                )
                return
            }
            SaveManager.ConvertJsonToSaveData(data, player)
        }
    }

    private static ConvertJsonToSaveData = (data: string, player: MapPlayer) => {
        const decodedData = json().decode(data)
        if (!decodedData) {
            player.DisplayTimedTextTo(
                8.0,
                `${Colors.COLOR_RED}Failed to deserialize data. Creating new save.${Colors.COLOR_RESET}`
            )
            Globals.SaveSystem.NewSave(player)
            return
        }

        // Create a new instance of KittyData and assign the decoded properties
        const kittyData = new KittyData()
        Object.assign(kittyData, decodedData)
        SetRewardsFromUnavailableToAvailable(kittyData)
        SaveManager.SaveData.set(player, kittyData)
        if (!SaveManager.PlayersLoaded.includes(player)) SaveManager.PlayersLoaded.push(player)
    }

    public static GetKittyData(player: MapPlayer): KittyData | undefined {
        const kittyData = SaveManager.SaveData.get(player)
        if (kittyData) {
            return kittyData
        } else {
            if (!SaveManager.PlayersLoaded.includes(player)) {
                Globals.SaveSystem.Load(player)
            } else {
                Globals.SaveSystem.NewSave(player)
            }
        }

        return SaveManager.SaveData.get(player)
    }
}

export class SyncSaveLoad {
    private static instance: SyncSaveLoad

    public static getInstance = (): SyncSaveLoad => {
        if (!SyncSaveLoad.instance) {
            SyncSaveLoad.instance = new SyncSaveLoad()
        }
        return SyncSaveLoad.instance
    }

    public SyncPrefix = 'S_TIO'
    public SyncPrefixFinish = 'S_TIOF'
    public SyncEvent: Trigger = Trigger.create()!
    private allPromises: Map<number, FilePromise> = new Map()

    private constructor() {
        for (let i = 0; i < GetBJMaxPlayers(); i++) {
            this.SyncEvent.registerPlayerSyncEvent(MapPlayer.fromIndex(i)!, this.SyncPrefix, false)
            this.SyncEvent.registerPlayerSyncEvent(MapPlayer.fromIndex(i)!, this.SyncPrefixFinish, false)
        }
        this.SyncEvent.addAction(this.OnSync)
    }

    /// <summary>
    /// Splits the given data object into chunks, encodes each chunk to a base64 JSON format,
    /// and writes the resulting data to the specified file.
    /// </summary>
    /// <param name="filename">The name of the file to write to.</param>
    /// <param name="data">The object to be encoded and written.</param>
    public WriteFileObjects = (filename: string, data: object | null = null) => {
        PreloadGenClear()
        PreloadGenStart()

        const rawDataString = data
            ? PropertyEncoder.EncodeToJsonBase64(data)
            : PropertyEncoder.EncodeAllDataToJsonBase64()
        const toCompile = rawDataString
        const chunkSize = 180
        let assemble = ''
        const noOfChunks = Math.ceil(toCompile.length / chunkSize)

        //print(`toCompile.length: ${toCompile.length}`);

        try {
            for (let i = 0; i < toCompile.length; i++) {
                assemble += toCompile[i]
                if (assemble.length >= chunkSize) {
                    const header =
                        EncodingHex.To32BitHexString(noOfChunks) +
                        EncodingHex.To32BitHexString(Math.ceil(i / chunkSize))
                    Preload(`")\ncall BlzSendSyncData("${this.SyncPrefix}","${header + assemble}")\ncall S2I("`)
                    assemble = ''
                }
            }
            if (assemble.length > 0) {
                const header = EncodingHex.To32BitHexString(noOfChunks) + EncodingHex.To32BitHexString(noOfChunks)
                Preload(`")\ncall BlzSendSyncData("${this.SyncPrefix}","${header + assemble}")\ncall S2I("`)
            }
        } catch (e) {
            Logger.Critical('Error in SyncSaveSystem.WriteFileObjects')
        }
        PreloadGenEnd(filename)
    }

    public Read(filename: string, reader: MapPlayer, onFinish: Action<FilePromise>): FilePromise {
        const playerId = reader.id
        if (!this.allPromises.has(playerId)) {
            this.allPromises.set(playerId, new FilePromise(reader, onFinish))
            if (reader.isLocal()) {
                PreloadStart()
                Preloader(filename)
                PreloadEnd(1)
                BlzSendSyncData(this.SyncPrefixFinish, '')
            }
        } else {
            Logger.Warning('Trying to read file when file read is already busy.')
        }
        return this.allPromises.get(playerId)!
    }

    private OnSync = () => {
        const readData = BlzGetTriggerSyncData()!
        const prefix = BlzGetTriggerSyncPrefix()!
        const totalChunkSize = readData.length >= 8 ? EncodingHex.ToNumber(readData.substring(0, 8)) : 0
        const currentChunk = readData.length >= 16 ? EncodingHex.ToNumber(readData.substring(8, 16)) : 0
        const theRest = readData.length > 16 ? readData.substring(16) : readData.substring(Math.min(readData.length, 8))
        const promise = this.allPromises.get(getTriggerPlayer().id)
        //Logger.Verbose("Loading ", currentChunk, " out of ", totalChunkSize);

        if (promise) {
            if (prefix === this.SyncPrefix) {
                promise.Buffer.set(currentChunk - 1, theRest)
            } else if (prefix === this.SyncPrefixFinish) {
                promise.Finish()
                this.allPromises.delete(promise.SyncOwner.id)
                //print("Promise killed: ", allPromises[promise.SyncOwner.id]);
            }
        } else {
            print(
                `Synchronized data in SyncSaveLoad when there is no promise present for MapPlayer: ${getTriggerPlayer().name}`
            )
        }
    }
}

export class FilePromise {
    public SyncOwner: MapPlayer
    public HasLoaded = false
    public Buffer: Map<number, string> = new Map()
    public DecodedString: string
    private onFinish: Action<FilePromise>

    public constructor(syncOwner: MapPlayer, onFinish: Action<FilePromise>) {
        this.SyncOwner = syncOwner
        this.onFinish = onFinish
    }

    public Finish = () => {
        try {
            this.HasLoaded = true
            const loadString: string[] = []
            for (let i = 0; i < this.Buffer.size; i++) {
                if (this.Buffer.has(i)) {
                    const d = this.Buffer.get(i)
                    d && loadString.push(d)
                    //if(!PROD) print(`${Buffer[i]}`);
                }
            }
            //FinalString = EncodingBase64.Decode(loadString.toString());
            this.DecodedString = PropertyEncoder.DecodeFromJsonBase64(loadString)

            /*            Logger.Verbose("loadString.length", loadString.length);
                        Logger.Verbose("Finished: ");
                        Logger.Verbose("DecodedString.length: ", DecodedString.length);*/
            //Logger.Verbose("FinalString: ", FinalString);

            this.onFinish?.(this)
        } catch (e) {
            Logger.Critical(e as string)
        }
    }
}

export class PropertyEncoder {
    public static EncodeToJsonBase64 = (obj: object) => {
        try {
            const jsonString = json().encode(obj)

            const base64String = EncodingBase64.Encode(jsonString)
            return base64String
        } catch (e) {
            // Handle any exceptions that may occur during encoding
            Logger.Critical(`${Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeToJsonBase64: ${e}`)
            throw e
        }
    }

    private static GetJsonData = (obj: object) => {
        const jsonString = ['{']
        PropertyEncoder.AppendProperties(obj, jsonString)
        jsonString.push('}')

        return jsonString.join('')
    }

    public static EncodeAllDataToJsonBase64(): string {
        try {
            let jsonString = ''
            jsonString += '{'
            for (const player of Globals.ALL_PLAYERS) {
                const playerData = SaveManager.SaveData.get(player)
                if (!playerData) continue
                jsonString += `"${player.name}":${json().encode(playerData)},`
            }
            if (jsonString.length > 0 && jsonString[jsonString.length - 1] === ',') {
                jsonString = jsonString.slice(0, -1)
            }
            jsonString += '}'

            const base64String = EncodingBase64.Encode(jsonString)
            return base64String
        } catch (e) {
            Logger.Critical(`${Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeAllDataToJsonBase64: ${e}`)
            throw e
        }
    }

    private static AppendProperties = (obj: object, jsonString: string[]) => {
        if (!obj) return

        let firstProperty = true

        for (const prop of Object.keys(obj)) {
            const value = obj[prop as keyof typeof obj]

            if (!firstProperty) {
                jsonString.push(',')
            }
            firstProperty = false

            jsonString.push(`"${prop}":`)

            if (value && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'string') {
                jsonString.push('{')
                PropertyEncoder.AppendProperties(value, jsonString)
                jsonString.push('}')
            } else {
                typeof value === 'string' ? jsonString.push(`"${value}"`) : jsonString.push(`${value}`)
            }
        }
    }

    public static DecodeFromJsonBase64 = (base64EncodedData: string[]) => {
        // Decode the Base64 string to a JSON-like string
        const jsonString = EncodingBase64.Decode(base64EncodedData.join(''))
        return jsonString
    }
}
