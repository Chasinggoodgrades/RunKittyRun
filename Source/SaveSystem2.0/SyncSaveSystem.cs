using System;
using System.Collections.Generic;
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
    private Dictionary<int, FilePromise> allPromises = new Dictionary<int, FilePromise>();

    private SyncSaveLoad()
    {
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

        string rawDataString;
        if (data != null)
            rawDataString = PropertyEncoder.EncodeToJsonBase64(data);
        else
            rawDataString = PropertyEncoder.EncodeAllDataToJsonBase64();

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
            Console.WriteLine(ex);
        }
        PreloadGenEnd(filename);
    }

    public FilePromise Read(string filename, player reader, Action<FilePromise> onFinish = null)
    {
        int playerId = reader.Id;
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
            Logger.Warning("Trying to read file when file read is already busy.");
        }
        return allPromises[playerId];
    }

    private void OnSync()
    {
        try
        {
            string readData = BlzGetTriggerSyncData();
            string prefix = BlzGetTriggerSyncPrefix();
            int totalChunkSize = readData.Length >= 8 ? EncodingHex.ToNumber(readData.Substring(0, 8)) : 0; 
            int currentChunk = readData.Length >= 16 ? EncodingHex.ToNumber(readData.Substring(8, 8)) : 0;
            string theRest = readData.Length > 16 ? readData.Substring(16) : readData.Substring(Math.Min(readData.Length, 8));
            var promise = allPromises[@event.Player.Id];
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
                Console.WriteLine($"Synchronized data in {nameof(SyncSaveLoad)} when there is no promise present for player: {GetPlayerName(GetTriggerPlayer())}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine((ex.StackTrace));
        }
    }
}
public class FilePromise
{
    public player SyncOwner { get; }
    public bool HasLoaded { get; private set; } = false;
    public Dictionary<int, string> Buffer { get; } = new Dictionary<int, string>();
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
            HasLoaded = true;
            StringBuilder loadString = new StringBuilder();
            for (int i = 0; i < Buffer.Count; i++)
            {
                if (Buffer.ContainsKey(i))
                {
                    loadString.Append(Buffer[i]);
                    //if(Source.Program.Debug) Console.WriteLine($"{Buffer[i]}");
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
        catch (Exception ex)
        {
            Logger.Critical(ex);
        }
    }
}



