using System;
using System.Text;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class SyncSaveLoad
{
    private static SyncSaveLoad instance;

    public static SyncSaveLoad Instance
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

    public string SyncPrefix { get; } = "S_TIO";
    public string SyncPrefixFinish { get; } = "S_TIOF";
    public trigger SyncEvent { get; } = trigger.Create();
    private FilePromise[] allPromises;

    private SyncSaveLoad()
    {
        allPromises = new FilePromise[GetBJMaxPlayers()];
        for (int i = 0; i < GetBJMaxPlayers(); i++)
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
    public void WriteFileObjects(string filename, object data = null)
    {
        PreloadGenClear();
        PreloadGenStart();

        string rawDataString = data != null ? PropertyEncoder.EncodeToJsonBase64(data) : PropertyEncoder.EncodeAllDataToJsonBase64();
        string toCompile = rawDataString;
        int chunkSize = 180;
        StringBuilder assemble = new StringBuilder();
        int noOfChunks = (int)Math.Ceiling((double)toCompile.Length / chunkSize);

        //Console.WriteLine($"toCompile.Length: {toCompile.Length}");

        try
        {
            for (int i = 0; i < toCompile.Length; i++)
            {
                assemble.Append(toCompile[i]);
                if (assemble.Length >= chunkSize)
                {
                    string header = EncodingHex.To32BitHexString(noOfChunks) + EncodingHex.To32BitHexString((int)Math.Ceiling((double)i / chunkSize));
                    Preload($"\")\ncall BlzSendSyncData(\"{SyncPrefix}\",\"{header + assemble}\")\ncall S2I(\"");
                    assemble.Clear();
                }
            }
            if (assemble.Length > 0)
            {
                string header = EncodingHex.To32BitHexString(noOfChunks) + EncodingHex.To32BitHexString(noOfChunks);
                Preload($"\")\ncall BlzSendSyncData(\"{SyncPrefix}\",\"{header + assemble}\")\ncall S2I(\"");
            }
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in SyncSaveSystem.WriteFileObjects: {ex.Message}");
        }
        PreloadGenEnd(filename);
    }

    /// <summary>
    /// Writes raw string data to a local file without encoding, syncing, or chunking.
    /// This file is write-only and never loaded back, primarily intended for debugging purposes. Will cause desyncs otherwise.. xd
    /// </summary>
    /// <param name="fileName">The name of the file to write to.</param>
    /// <param name="data">The raw string data to write.</param>
    public void WriteStringNoEncodeNoLoad(string fileName, string data)
    {
        PreloadGenClear();
        PreloadGenStart();

        // i have no idea if this will work. pray?
        Preload($"{data}");
        
        PreloadGenEnd(fileName);
    }

    public FilePromise Read(string filename, player reader, Action<FilePromise> onFinish = null)
    {
        int playerId = reader.Id;
        if (playerId < 0 || playerId >= allPromises.Length)
        {
            Logger.Warning($"Read called with out-of-range player id: {playerId}");
            return null;
        }
        if (allPromises[playerId] == null)
        {
            Console.WriteLine($"{Colors.COLOR_TURQUOISE}Starting file read for player: {Colors.PlayerNameColored(reader)}{Colors.COLOR_RESET}");
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
            Logger.Warning("Trying to read file when file read is already busy.");
        }
        return allPromises[playerId];
    }

    private void OnSync()
    {
        string readData = BlzGetTriggerSyncData();
        string prefix = BlzGetTriggerSyncPrefix();
        int totalChunkSize = readData.Length >= 8 ? EncodingHex.ToNumber(readData.Substring(0, 8)) : 0;
        int currentChunk = readData.Length >= 16 ? EncodingHex.ToNumber(readData.Substring(8, 8)) : 0;
        string theRest = readData.Length > 16 ? readData.Substring(16) : readData.Substring(Math.Min(readData.Length, 8));
        int playerId = @event.Player.Id;
        if (playerId < 0 || playerId >= allPromises.Length) return;
        var promise = allPromises[playerId];
        //Logger.Verbose("Loading ", currentChunk, " out of ", totalChunkSize); // If this gets called more than 344 times in a single frame (0.015 seconds), it has 100% chance of desync
        if (currentChunk > 300)
        {
            Logger.Warning($"SyncSaveLoad: Current chunk is {currentChunk} / {totalChunkSize}, which is nearing 344 limit. This may cause desyncs.");
        }

        if (promise != null)
        {
            if (prefix == SyncPrefix)
            {
                if (promise.ExpectedChunkCount < 0)
                    promise.ExpectedChunkCount = totalChunkSize;
                promise.Buffer[currentChunk - 1] = theRest;
            }
            else if (prefix == SyncPrefixFinish)
            {
                Console.WriteLine($"{Colors.COLOR_TURQUOISE}Sync finished for player: {Colors.PlayerNameColored(promise.SyncOwner)}{Colors.COLOR_RESET}");
                promise.Finish();
                allPromises[GetPlayerId(promise.SyncOwner)] = null;
                //Console.WriteLine("Promise killed");
            }
        }
        else
        {
            Console.WriteLine($"Synchronized data in {nameof(SyncSaveLoad)} when there is no promise present for player: {Colors.PlayerNameColored(GetTriggerPlayer())}");
        }
    }
}

public class FilePromise
{
    public player SyncOwner { get; }
    public bool HasLoaded { get; private set; } = false;
    public string[] Buffer { get; private set; }
    private int expectedChunkCount = -1;
    public int ExpectedChunkCount
    {
        get => expectedChunkCount;
        set
        {
            expectedChunkCount = value;
            if (value > 0)
                Buffer = new string[value];
        }
    }
    public string DecodedString { get; private set; }
    private Action<FilePromise> onFinish;

    public FilePromise(player syncOwner, Action<FilePromise> onFinish = null)
    {
        SyncOwner = syncOwner;
        this.onFinish = onFinish;
    }

    public void Finish()
    {
        try
        {
            Console.WriteLine($"{Colors.COLOR_TURQUOISE}Beginning finishing callback for player: {Colors.PlayerNameColored(SyncOwner)}{Colors.COLOR_RESET}");
            HasLoaded = true;


            if (ExpectedChunkCount > 0 && (Buffer == null || Buffer.Length != ExpectedChunkCount))
            {
                Logger.Critical($"FilePromise incomplete for {GetPlayerName(SyncOwner)}: " +
                    $"expected {ExpectedChunkCount} chunks, got {(Buffer == null ? 0 : Buffer.Length)}.");

                onFinish?.Invoke(this);
                return;
            }

            StringBuilder loadString = new StringBuilder();
            if (Buffer != null)
            {
                for (int i = 0; i < Buffer.Length; i++)
                {
                    if (Buffer[i] != null)
                        loadString.Append(Buffer[i]);
                }
            }

            //FinalString = WCSharp.Shared.Base64.FromBase64(loadString.ToString());
            DecodedString = PropertyEncoder.DecodeFromJsonBase64(loadString);

            /*            Logger.Verbose("loadString.Length", loadString.Length);
                        Logger.Verbose("Finished: ");
                        Logger.Verbose("DecodedString.Length: ", DecodedString.Length);*/
            //Logger.Verbose("FinalString: ", FinalString);
            Console.WriteLine($"{Colors.COLOR_TURQUOISE}Finished finishing callback for player: {Colors.PlayerNameColored(SyncOwner)}{Colors.COLOR_RESET}");
            onFinish?.Invoke(this);
        }
        catch (Exception ex)
        {
            Logger.Critical(ex);
        }
    }
}
