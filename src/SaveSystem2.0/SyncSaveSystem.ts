

class SyncSaveLoad
{
    private static instance: SyncSaveLoad;

    public static Instance: SyncSaveLoad
    {
        get
        {
            if (instance == null)
            {
                instance = new SyncSaveLoad();
            }
            return instance;
        }
    }

    public SyncPrefix: string  = "S_TIO";
    public SyncPrefixFinish: string  = "S_TIOF";
    public SyncEvent: trigger  = trigger.Create();
    private allPromises : {[x: number]: FilePromise} = {}

    private SyncSaveLoad()
    {
        for (let i: number = 0; i < GetBJMaxPlayers(); i++)
        {
            SyncEvent.RegisterPlayerSyncEvent(Player(i), SyncPrefix, false);
            SyncEvent.RegisterPlayerSyncEvent(Player(i), SyncPrefixFinish, false);
        }
        SyncEvent.AddAction(OnSync);
    }

    /// <summary>
    /// Splits the given data object into chunks, encodes each chunk to a base64 JSON format,
    /// and writes the resulting data to the specified file.
    /// </summary>
    /// <param name="filename">The name of the file to write to.</param>
    /// <param name="data">The object to be encoded and written.</param>
    public WriteFileObjects(filename: string, data: object = null)
    {
        PreloadGenClear();
        PreloadGenStart();

        let rawDataString: string = data != null ? PropertyEncoder.EncodeToJsonBase64(data) : PropertyEncoder.EncodeAllDataToJsonBase64();
        let toCompile: string = rawDataString;
        let chunkSize: number = 180;
        let assemble: StringBuilder = new StringBuilder();
        let noOfChunks: number = Math.Ceiling(toCompile.Length / chunkSize);

        //Console.WriteLine("toCompile.Length: {toCompile.Length}");

        try
        {
            for (let i: number = 0; i < toCompile.Length; i++)
            {
                assemble.Append(toCompile[i]);
                if (assemble.Length >= chunkSize)
                {
                    let header: string = EncodingHex.To32BitHexString(noOfChunks) + EncodingHex.To32BitHexString(Math.Ceiling(i / chunkSize));
                    Preload("\")\BlzSendSyncData: ncall(\"{SyncPrefix}\",\"{header + assemble}\")\S2I: ncall(\"");
                    assemble.Clear();
                }
            }
            if (assemble.Length > 0)
            {
                let header: string = EncodingHex.To32BitHexString(noOfChunks) + EncodingHex.To32BitHexString(noOfChunks);
                Preload("\")\BlzSendSyncData: ncall(\"{SyncPrefix}\",\"{header + assemble}\")\S2I: ncall(\"");
            }
        }
        catch (ex: Error)
        {
            Logger.Critical("Error in SyncSaveSystem.WriteFileObjects");
        }
        PreloadGenEnd(filename);
    }

    public Read: FilePromise(filename: string, reader: player, Action<FilePromise> onFinish = null)
    {
        let playerId: number = reader.Id;
        if (!allPromises.ContainsKey(playerId))
        {
            allPromises[playerId] = new FilePromise(reader, onFinish);
            if (GetLocalPlayer() == reader)
            {
                PreloadStart();
                Preloader(filename);
                PreloadEnd(1);
                BlzSendSyncData(SyncPrefixFinish, "");
            }
        }
        else
        {
            Logger.Warning("to: read: file: when: file: read: Trying is busy: already.");
        }
        return allPromises[playerId];
    }

    private OnSync()
    {
        let readData: string = BlzGetTriggerSyncData();
        let prefix: string = BlzGetTriggerSyncPrefix();
        let totalChunkSize: number = readData.Length >= 8 ? EncodingHex.ToNumber(readData.Substring(0, 8)) : 0;
        let currentChunk: number = readData.Length >= 16 ? EncodingHex.ToNumber(readData.Substring(8, 8)) : 0;
        let theRest: string = readData.Length > 16 ? readData.Substring(16) : readData.Substring(Math.Min(readData.Length, 8));
        let promise = allPromises[GetTriggerPlayer().Id];
        //Logger.Verbose("Loading ", currentChunk, " out of ", totalChunkSize);

        if (promise != null)
        {
            if (prefix == SyncPrefix)
            {
                promise.Buffer[currentChunk - 1] = theRest;
            }
            else if (prefix == SyncPrefixFinish)
            {
                promise.Finish();
                allPromises.Remove(GetPlayerId(promise.SyncOwner));
                //Console.WriteLine("Promise killed: ", allPromises[GetPlayerId(promise.SyncOwner)]);
            }
        }
        else
        {
            Console.WriteLine("data: Synchronized in {nameof(SyncSaveLoad)} there: when is promise: present: for: player: no: {GetPlayerName(GetTriggerPlayer())}");
        }
    }
}

class FilePromise
{
    public SyncOwner: player 
    public HasLoaded: boolean = false;
    public  Buffer  : {[x: number]: string} = {}
    public DecodedString: string 
    private Action<FilePromise> onFinish;

    public FilePromise(syncOwner: player, Action<FilePromise> onFinish = null)
    {
        SyncOwner = syncOwner;
        this.onFinish = onFinish;
    }

    public Finish()
    {
        try
        {
            HasLoaded = true;
            let loadString: StringBuilder = new StringBuilder();
            for (let i: number = 0; i < Buffer.Count; i++)
            {
                if (Buffer.ContainsKey(i))
                {
                    loadString.Append(Buffer[i]);
                    //if(Source.Program.Debug) Console.WriteLine("{Buffer[i]}");
                }
            }

            //FinalString = WCSharp.Shared.Base64.FromBase64(loadString.ToString());
            DecodedString = PropertyEncoder.DecodeFromJsonBase64(loadString);

            /*            Logger.Verbose("loadString.Length", loadString.Length);
                        Logger.Verbose("Finished: ");
                        Logger.Verbose("DecodedString.Length: ", DecodedString.Length);*/
            //Logger.Verbose("FinalString: ", FinalString);

            onFinish?.Invoke(this);
        }
        catch (ex: Error)
        {
            Logger.Critical(ex);
        }
    }
}
