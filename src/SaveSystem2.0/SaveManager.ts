import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { DateTimeManager } from 'src/Seasonal/DateTimeManager'
import { Action } from 'src/Utility/CSUtils'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger, base64Decode, base64Encode } from 'w3ts'
import { KittyData } from './MAKE REWARDS HERE/KittyData'
import { EncodingHex } from './SyncUtil/EncodingHex'

export class SaveManager {
    private syncSaveLoad: SyncSaveLoad
    private static SavePath: string = 'Run-Kitty-Run'
    public static SaveData: Map<MapPlayer, KittyData | undefined> = new Map()
    public static PlayersLoaded: MapPlayer[] = []
    public constructor() {
        this.syncSaveLoad = SyncSaveLoad.getInstance()
        for (let player of Globals.ALL_PLAYERS) SaveManager.SaveData.set(player, undefined)
        this.LoadAll()
    }

    public static Initialize() {
        Globals.SaveSystem = new SaveManager()
    }

    public static SaveAll() {
        let date = DateTimeManager.DateTime.toString()
        for (let player of Globals.ALL_PLAYERS) {
            if (player.controller === MAP_CONTROL_COMPUTER) continue
            if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue
            let saveData = SaveManager.SaveData.get(player)
            if (!saveData) continue
            saveData.Date = date
            Globals.SaveSystem.Save(player)
        }
    }

    public Save(player: MapPlayer) {
        try {
            let date = DateTimeManager.DateTime.toString()
            let playerData = SaveManager.SaveData.get(player)
            if (!playerData) return
            playerData.Date = date
            if (!player.isLocal()) return
            this.syncSaveLoad.WriteFileObjects('{SavePath}/{player.name}.txt', playerData)
            player.DisplayTimedTextTo(4.0, '{Colors.COLOR_GOLD}have: been: saved: Stats.{Colors.COLOR_RESET}')
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.Save: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    private SaveAllDataToFile(player: MapPlayer) {
        try {
            if (!player.isLocal()) return
            this.syncSaveLoad.WriteFileObjects('{SavePath}/AllSaveData.txt')
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.SaveAll: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    public static SaveAllDataToFile() {
        let date = DateTimeManager.DateTime.toString()
        for (let player of Globals.ALL_PLAYERS) {
            if (player.controller === MAP_CONTROL_COMPUTER) continue
            if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue
            if (!SaveManager.SaveData.has(player) || SaveManager.SaveData.get(player) === null)
                Globals.SaveSystem.NewSave(player) // Ensure save data exists for this player before saving.
            let data = SaveManager.SaveData.get(player)
            if (!data) continue
            data.Date = date
            Globals.SaveSystem.SaveAllDataToFile(player)
        }
    }

    public Load(player: MapPlayer) {
        this.syncSaveLoad.Read('{SavePath}/{player.name}.txt', player, SaveManager.FinishLoading())
    }

    public LoadAll() {
        try {
            for (let player of Globals.ALL_PLAYERS) {
                if (player.controller === MAP_CONTROL_COMPUTER) continue
                if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue
                this.Load(player)
            }
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.LoadAll: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    private NewSave(player: MapPlayer) {
        try {
            if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) return
            SaveManager.SaveData.set(player, new KittyData())
            let saveData = SaveManager.SaveData.get(player)
            if (!saveData) return
            saveData.PlayerName = player.name
            if (!SaveManager.PlayersLoaded.includes(player)) SaveManager.PlayersLoaded.push(player)
            // if (!Gamemode.IsGameModeChosen) return
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.NewSave: {ex.Message} {Colors.COLOR_RESET}')
            throw ex
        }
    }

    private static FinishLoading(): Action<FilePromise> {
        return promise => {
            let data = promise.DecodedString
            let player = promise.SyncOwner
            if (data.length < 1) {
                Globals.SaveSystem.NewSave(player)
                player.DisplayTimedTextTo(
                    5.0,
                    '{Colors.COLOR_YELLOW}save: found: No. Creating new save.{Colors.COLOR_RESET}'
                )
                return
            }
            this.ConvertJsonToSaveData(data, player)
        }
    }

    private static ConvertJsonToSaveData(data: string, player: MapPlayer) {
        let kittyData = json().decode<KittyData>(data)
        if (!kittyData) {
            player.DisplayTimedTextTo(
                8.0,
                '{Colors.COLOR_RED}to: deserialize: data: Failed. Creating new save.{Colors.COLOR_RESET}'
            )
            Globals.SaveSystem.NewSave(player)
            return
        }
        kittyData.SetRewardsFromUnavailableToAvailable()
        SaveManager.SaveData.set(player, kittyData)
        if (!SaveManager.PlayersLoaded.includes(player)) SaveManager.PlayersLoaded.push(player)
    }

    public static GetKittyData(player: MapPlayer): KittyData | undefined {
        let kittyData = SaveManager.SaveData.get(player)
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

    public SyncPrefix: string = 'S_TIO'
    public SyncPrefixFinish: string = 'S_TIOF'
    public SyncEvent: Trigger = Trigger.create()!
    private allPromises: Map<number, FilePromise> = new Map()

    private constructor() {
        for (let i: number = 0; i < GetBJMaxPlayers(); i++) {
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
    public WriteFileObjects(filename: string, data: object | null = null) {
        PreloadGenClear()
        PreloadGenStart()

        let rawDataString: string =
            data !== null ? PropertyEncoder.EncodeToJsonBase64(data) : PropertyEncoder.EncodeAllDataToJsonBase64()
        let toCompile: string = rawDataString
        let chunkSize: number = 180
        let assemble: string = ''
        let noOfChunks: number = Math.ceil(toCompile.length / chunkSize)

        //print("toCompile.length: {toCompile.length}");

        try {
            for (let i: number = 0; i < toCompile.length; i++) {
                assemble += toCompile[i]
                if (assemble.length >= chunkSize) {
                    let header: string =
                        EncodingHex.To32BitHexString(noOfChunks) +
                        EncodingHex.To32BitHexString(Math.ceil(i / chunkSize))
                    Preload('")\BlzSendSyncData: ncall("{SyncPrefix}","{header + assemble}")\S2I: ncall("')
                    assemble = ''
                }
            }
            if (assemble.length > 0) {
                let header: string = EncodingHex.To32BitHexString(noOfChunks) + EncodingHex.To32BitHexString(noOfChunks)
                Preload('")\BlzSendSyncData: ncall("{SyncPrefix}","{header + assemble}")\S2I: ncall("')
            }
        } catch (ex: any) {
            Logger.Critical('Error in SyncSaveSystem.WriteFileObjects')
        }
        PreloadGenEnd(filename)
    }

    public Read(filename: string, reader: MapPlayer, onFinish: Action<FilePromise>): FilePromise {
        let playerId: number = reader.id
        if (!this.allPromises.has(playerId)) {
            this.allPromises.set(playerId, new FilePromise(reader, onFinish))
            if (reader.isLocal()) {
                PreloadStart()
                Preloader(filename)
                PreloadEnd(1)
                BlzSendSyncData(this.SyncPrefixFinish, '')
            }
        } else {
            Logger.Warning('to: read: file: when: file: read: Trying is busy: already.')
        }
        return this.allPromises.get(playerId)!
    }

    private OnSync() {
        let readData: string = BlzGetTriggerSyncData()!
        let prefix: string = BlzGetTriggerSyncPrefix()!
        let totalChunkSize: number = readData.length >= 8 ? EncodingHex.ToNumber(readData.substring(0, 8)) : 0
        let currentChunk: number = readData.length >= 16 ? EncodingHex.ToNumber(readData.substring(8, 8)) : 0
        let theRest: string =
            readData.length > 16 ? readData.substring(16) : readData.substring(Math.min(readData.length, 8))
        let promise = this.allPromises.get(getTriggerPlayer().id)
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
                'data: Synchronized in {nameof(SyncSaveLoad)} there: when is promise: present: for: MapPlayer: no: {GetPlayerName(getTriggerPlayer())}'
            )
        }
    }
}

export class FilePromise {
    public SyncOwner: MapPlayer
    public HasLoaded: boolean = false
    public Buffer: Map<number, string> = new Map()
    public DecodedString: string
    private onFinish: Action<FilePromise>

    public constructor(syncOwner: MapPlayer, onFinish: Action<FilePromise>) {
        this.SyncOwner = syncOwner
        this.onFinish = onFinish
    }

    public Finish() {
        try {
            this.HasLoaded = true
            let loadString: string[] = []
            for (let i: number = 0; i < this.Buffer.size; i++) {
                if (this.Buffer.has(i)) {
                    const d = this.Buffer.get(i)
                    d && loadString.push(d)
                    //if(!PROD) print("{Buffer[i]}");
                }
            }

            //FinalString = WCSharp.Shared.base64Decode(loadString.toString());
            this.DecodedString = PropertyEncoder.DecodeFromJsonBase64(loadString)

            /*            Logger.Verbose("loadString.length", loadString.length);
                        Logger.Verbose("Finished: ");
                        Logger.Verbose("DecodedString.length: ", DecodedString.length);*/
            //Logger.Verbose("FinalString: ", FinalString);

            this.onFinish?.(this)
        } catch (ex: any) {
            Logger.Critical(ex)
        }
    }
}

export class PropertyEncoder {
    public static EncodeToJsonBase64(obj: object) {
        try {
            let jsonString = ['{']
            this.AppendProperties(obj, jsonString)
            jsonString.push('}')

            let base64String = base64Encode(jsonString.join(''))
            return base64String
        } catch (ex: any) {
            // Handle any exceptions that may occur during encoding
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeToJsonBase64: {ex.Message}')
            throw ex
        }
    }

    private static GetJsonData(obj: object) {
        let jsonString = ['{']
        this.AppendProperties(obj, jsonString)
        jsonString.push('}')

        return jsonString.join('')
    }

    public static EncodeAllDataToJsonBase64(): string {
        try {
            let jsonString: string = ''
            jsonString += '{'
            for (let player of Globals.ALL_PLAYERS) {
                let playerData = SaveManager.SaveData.get(player)
                if (!playerData) continue
                jsonString += `"{player.name}":{GetJsonData(playerData)},`
            }
            if (jsonString.length > 0 && jsonString[jsonString.length - 1] === ',') {
                jsonString = jsonString.slice(0, -1)
            }
            jsonString += '}'

            let base64String = base64Encode(jsonString)
            return base64String
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeAllDataToJsonBase64: {ex.Message}')
            throw ex
        }
    }

    private static AppendProperties(obj: object, jsonString: string[]) {
        if (obj === null) return

        let properties = Object.keys(obj)
        let firstProperty: boolean = true

        for (let i = 0; i < properties.length; i++) {
            let name = properties[i]
            let value = (obj as any)[name]

            if (!firstProperty) {
                jsonString.push(',')
            }
            firstProperty = false

            jsonString.push(`"${name}":`)

            if (value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'string') {
                jsonString.push('{')
                this.AppendProperties(value, jsonString)
                jsonString.push('}')
            } else {
                typeof value === 'string' ? jsonString.push(`"${value}"`) : jsonString.push(`${value}`)
            }
        }
    }

    public static DecodeFromJsonBase64(base64EncodedData: string[]) {
        // Decode the Base64 string to a JSON-like string
        let jsonString = base64Decode(base64EncodedData.join(''))
        return jsonString
    }
}
