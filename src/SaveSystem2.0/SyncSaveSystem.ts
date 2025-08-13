import { Logger } from 'src/Events/Logger/Logger'
import { Action } from 'src/Utility/CSUtils'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger } from 'w3ts'
import { EncodingHex } from './SyncUtil/EncodingHex'
import { PropertyEncoder } from './SyncUtil/PropertyEncoder'

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
            SyncEvent.RegisterPlayerSyncEvent(MapPlayer.fromIndex(i)!, SyncPrefix, false)
            SyncEvent.RegisterPlayerSyncEvent(MapPlayer.fromIndex(i)!, SyncPrefixFinish, false)
        }
        SyncEvent.addAction(OnSync)
    }

    /// <summary>
    /// Splits the given data object into chunks, encodes each chunk to a base64 JSON format,
    /// and writes the resulting data to the specified file.
    /// </summary>
    /// <param name="filename">The name of the file to write to.</param>
    /// <param name="data">The object to be encoded and written.</param>
    public WriteFileObjects(filename: string, data: object = null) {
        PreloadGenClear()
        PreloadGenStart()

        let rawDataString: string =
            data != null ? PropertyEncoder.EncodeToJsonBase64(data) : PropertyEncoder.EncodeAllDataToJsonBase64()
        let toCompile: string = rawDataString
        let chunkSize: number = 180
        let assemble: StringBuilder = new StringBuilder()
        let noOfChunks: number = Math.Ceiling(toCompile.length / chunkSize)

        //print("toCompile.length: {toCompile.length}");

        try {
            for (let i: number = 0; i < toCompile.length; i++) {
                assemble.Append(toCompile[i])
                if (assemble.length >= chunkSize) {
                    let header: string =
                        EncodingHex.To32BitHexString(noOfChunks) +
                        EncodingHex.To32BitHexString(Math.Ceiling(i / chunkSize))
                    Preload('")\BlzSendSyncData: ncall("{SyncPrefix}","{header + assemble}")\S2I: ncall("')
                    assemble.clear()
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

    public Read(filename: string, reader: MapPlayer, onFinish: Action<FilePromise> = null): FilePromise {
        let playerId: number = reader.id
        if (!allPromises.has(playerId)) {
            allPromises[playerId] = new FilePromise(reader, onFinish)
            if (reader.isLocal()) {
                PreloadStart()
                Preloader(filename)
                PreloadEnd(1)
                BlzSendSyncData(SyncPrefixFinish, '')
            }
        } else {
            Logger.Warning('to: read: file: when: file: read: Trying is busy: already.')
        }
        return allPromises[playerId]
    }

    private OnSync() {
        let readData: string = BlzGetTriggerSyncData()
        let prefix: string = BlzGetTriggerSyncPrefix()
        let totalChunkSize: number = readData.length >= 8 ? EncodingHex.ToNumber(readData.substring(0, 8)) : 0
        let currentChunk: number = readData.length >= 16 ? EncodingHex.ToNumber(readData.substring(8, 8)) : 0
        let theRest: string =
            readData.length > 16 ? readData.substring(16) : readData.substring(Math.Min(readData.length, 8))
        let promise = allPromises[getTriggerPlayer().id]
        //Logger.Verbose("Loading ", currentChunk, " out of ", totalChunkSize);

        if (promise != null) {
            if (prefix == SyncPrefix) {
                promise.Buffer[currentChunk - 1] = theRest
            } else if (prefix == SyncPrefixFinish) {
                promise.Finish()
                allPromises.Remove(promise.SyncOwner.id)
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

    public FilePromise(syncOwner: MapPlayer, onFinish: Action<FilePromise> = null) {
        SyncOwner = syncOwner
        this.onFinish = onFinish
    }

    public Finish() {
        try {
            HasLoaded = true
            let loadString: StringBuilder = new StringBuilder()
            for (let i: number = 0; i < Buffer.length; i++) {
                if (Buffer.has(i)) {
                    loadString.Append(Buffer[i])
                    //if(Source.Program.Debug) print("{Buffer[i]}");
                }
            }

            //FinalString = WCSharp.Shared.base64Decode(loadString.toString());
            DecodedString = PropertyEncoder.DecodeFromJsonBase64(loadString)

            /*            Logger.Verbose("loadString.length", loadString.length);
                        Logger.Verbose("Finished: ");
                        Logger.Verbose("DecodedString.length: ", DecodedString.length);*/
            //Logger.Verbose("FinalString: ", FinalString);

            onFinish?.Invoke(this)
        } catch (ex: any) {
            Logger.Critical(ex)
        }
    }
}
