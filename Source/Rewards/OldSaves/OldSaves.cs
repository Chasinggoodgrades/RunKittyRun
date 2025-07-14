using System;
using System.Collections.Generic;
using System.Text;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Savecode
{
    private static string player_charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static List<string> OriginalToolTips { get; set; } = new();
    public double Digits { get; private set; }
    public BigNum Bignum { get; private set; }
    public static Dictionary<player, Savecode> PlayerSaveObject { get; private set; } = new Dictionary<player, Savecode>();

    public static void Initialize()
    {
        try
        {
            OldsaveSync.Initialize();
            for (int i = 0; i < OldSavesHelper.AbilityList.Length; i++)
            {
                var ability = OldSavesHelper.AbilityList[i];
                var tooltip = BlzGetAbilityTooltip(ability, 0);
                if (tooltip != "Tool tip missing!")
                    OriginalToolTips.Add(tooltip);
                else
                    throw new ArgumentException($"Error, tooltip not available: {ability}");
            }
            foreach (var player in Globals.ALL_PLAYERS)
            {
                InitializeSaveCode(player);
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in OldSaves.Initialize: {e.Message}");
            throw;
        }
    }

    private static void InitializeSaveCode(player p)
    {
        if (!PlayerSaveObject.ContainsKey(p))
        {
            PlayerSaveObject[p] = new Savecode();
        }
    }

    public Savecode()
    {
        Digits = 0.0;
        Bignum = new BigNum(BASE());
    }

    public int Decode(int max) => Bignum.DivSmall(max + 1);

    public void Clean() => Bignum.Clean();

    public void FromString(string s)
    {
        var i = s.Length - 1;
        var cur = BigNumL.Create();
        Bignum.List = cur;

        while (true)
        {
            cur.Leaf = OldSavesHelper.CharToInt(s[i]);
            if (i <= 0) break;
            cur.Next = BigNumL.Create();
            cur = cur.Next;
            i--;
        }
    }

    public int Hash()
    {
        var hash = 0;
        int x;
        BigNumL current = Bignum.List;

        while (current != null)
        {
            x = current.Leaf;
            hash = OldSavesHelper.ModuloInteger(hash + (79 * hash / (x + 1)) + (293 * x / (1 + hash - (hash / BASE() * BASE()))) + 479, HASHN());
            current = current.Next;
        }

        return hash;
    }

    public void Obfuscate(int key, int sign)
    {
        int seed = GetRandomInt(0, int.MaxValue);
        int advance = 0;
        int x = 0;
        BigNumL current = Bignum.List;

        if (sign == -1)
        {
            SetRandomSeed(Bignum.LastDigit());
            current.Leaf = Modb(current.Leaf + (sign * GetRandomInt(0, BASE() - 1)));
            x = current.Leaf;
        }
        SetRandomSeed(key);

        while (current != null)
        {
            if (sign == -1)
            {
                advance = current.Leaf;
            }

            current.Leaf = Modb(current.Leaf + (sign * GetRandomInt(0, BASE() - 1)));

            if (sign == 1)
            {
                advance = current.Leaf;
            }

            advance += GetRandomInt(0, BASE() - 1);
            SetRandomSeed(advance);

            x = current.Leaf;
            current = current.Next;
        }

        if (sign == 1)
        {
            SetRandomSeed(x);
            Bignum.List.Leaf = Modb(Bignum.List.Leaf + (sign * GetRandomInt(0, BASE() - 1)));
        }

        SetRandomSeed(seed);
    }

    public bool Load(player p, string code)
    {
        try
        {
            int key = SCommHash(p.Name) + (1 * 73);
            int inputhash = 0;

            FromString(code);
            Obfuscate(key, -1);
            inputhash = Decode(HASHN());
            Clean();

            return inputhash == Hash();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in OldSaves.Load, version code must be from v4.2.0 or greater. {e.Message}");
            return false;
        }
    }

    public static void LoadString()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard)
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}Old save codes work only in Standard");
            return;
        }

        var filePath = "RunKittyRun\\SaveSlot_RKR.pld";
        var sb = new StringBuilder();
        Preloader(filePath);

        for (var i = 0; i < OldSavesHelper.AbilityList.Length; i++)
        {
            var abilityID = OldSavesHelper.AbilityList[i];
            var originalTooltip = OriginalToolTips[i];

            var packet = BlzGetAbilityTooltip(abilityID, 0);
            if (packet == originalTooltip)
                break;
            else
            {
                BlzSetAbilityTooltip(abilityID, originalTooltip, 0);
                sb.Append(packet);
            }
        }
        var result = sb.ToString();
        var newLineStart = result.IndexOf('\n');
        if (newLineStart >= 0)
            result = result.Substring(newLineStart + 1);

        sb.Clear().Append(result);
        OldsaveSync.SyncString(sb.ToString());
    }

    /// <summary>
    /// Method that is setting the values of rewards for the players.
    /// </summary>
    /// <param name="player"></param>
    public void SetRewardValues(player player)
    {
        var awardData = Globals.ALL_KITTIES[player].SaveData.GameAwardsSorted;
        var roundstats = Globals.ALL_KITTIES[player].SaveData.RoundTimes;
        var kittyStats = Globals.ALL_KITTIES[player].SaveData.GameStats;

        foreach (var value in DecodeOldsave.decodeValues)
        {
            var decodedValue = Decode(value.Value);
            var propertyValue = RewardHelper.GetAwardNestedValue(awardData, value.Key);
            // Award Events
            if (propertyValue != -1 && decodedValue == 1)
            {
                if (propertyValue == 0)
                {
                    AwardManager.GiveReward(player, value.Key);
                    continue;
                }
            }
            var property = roundstats.GetType().GetProperty(value.Key);
            // Round Times
            if (property != null)
            {
                if (decodedValue < (int)property.GetValue(roundstats) || (int)property.GetValue(roundstats) == 0)
                {
                    property.SetValue(roundstats, decodedValue);
                    continue;
                }
            }
            property = kittyStats.GetType().GetProperty(value.Key);
            // Game Stats
            if (property != null)
            {
                if (decodedValue > (int)property.GetValue(kittyStats))
                {
                    property.SetValue(kittyStats, decodedValue);
                    continue;
                }
            }
        }
    }

    private static int SCommHash(string name)
    {
        var charlen = player_charset.Length;
        var count = new int[charlen];
        int x;
        foreach (var c in name.ToUpper())
        {
            x = OldSavesHelper.Player_CharToInt(c);
            if (x >= 0) count[x]++;
        }

        x = 0;
        for (var i = 0; i < charlen; i++)
            x = (count[i] * count[i] * i) + (count[i] * x) + x + 199;

        if (x < 0)
            x = -x;

        return x;
    }

    private static int BASE() => OldSavesHelper.charset.Length;

    private static int HASHN() => 5000;

    private static int Modb(int x)
    {
        if (x >= BASE()) return x - BASE();
        else if (x < 0) return x + BASE();
        return x;
    }
}
