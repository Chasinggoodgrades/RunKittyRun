using WCSharp.Api;
using System;
using static WCSharp.Api.Common;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using System.Collections;
using WCSharp.SaveLoad;
using System.Text;
using System.Runtime.CompilerServices;

public class Savecode
{
    public static string charset = "!$%&'()*+,-.0123456789:;=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}`";
    private static string player_charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    public double Digits { get; private set; } // logarithmic approximation
    public BigNum Bignum { get; private set; }
    private static List<string> OriginalToolTips { get; set; } = new();

    public static void Initialize()
    {
        for (int i = 0; i < OldSavesHelper.AbilityList.Count(); i++)
        {
            var ability = OldSavesHelper.AbilityList[i];
            var tooltip = BlzGetAbilityTooltip(ability, 0);
            if (tooltip != "Tool tip missing!")
                OriginalToolTips.Add(tooltip);
            else
                throw new ArgumentException($"Error, tooltip not available: {ability}");
        }
    }
    public Savecode()
    {
        Digits = 0.0;
        Bignum = new BigNum(BASE());
    }
    public static Savecode Create() => new Savecode();
    public int Decode(int max) => Bignum.DivSmall(max + 1);
    public void Clean() => Bignum.Clean();
    public void FromString(string s)
    {
        int i = s.Length - 1;
        BigNumL cur = BigNumL.Create();
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
        int hash = 0;
        int x;
        BigNumL current = Bignum.List;

        while (current != null)
        {
            x = current.Leaf;
            hash = OldSavesHelper.ModuloInteger(hash + 79 * hash / (x + 1) + 293 * x / (1 + hash - (hash / BASE()) * BASE()) + 479, HASHN());
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
            Console.WriteLine(Bignum.LastDigit());
            SetRandomSeed(Bignum.LastDigit());
            current.Leaf = Modb(current.Leaf + sign * GetRandomInt(0, BASE() - 1));
            x = current.Leaf;
        }

        SetRandomSeed(key);

        while (current != null)
        {
            if (sign == -1)
            {
                advance = current.Leaf;
            }

            current.Leaf = Modb(current.Leaf + sign * GetRandomInt(0, BASE() - 1));

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
            Bignum.List.Leaf = Modb(Bignum.List.Leaf + sign * GetRandomInt(0, BASE() - 1));
        }

        SetRandomSeed(seed);
    }
    public bool Load(player p, string s, int loadtype)
    {
        try
        {
            int key = SCommHash(p.Name) + loadtype * 73;
            int inputhash = 0;
            string code = LoadString(p).ToString();

            FromString(s);
            Obfuscate(key, -1);
            inputhash = Decode(HASHN());
            Clean();

            if(inputhash == Hash())
                SetRewardValues(p);

            return inputhash == Hash();
        }
        catch (Exception e)
        {
            Console.WriteLine("Error in loading old code. Must be v4.2.0 or greater.");
            return false;
        }
    }

    private StringBuilder LoadString(player p)
    {
        var filePath = "RunKittyRun\\SaveSlot_RKR.pld";
        var sb = new StringBuilder();

        Preloader(filePath);

        for(var i = 0; i < OldSavesHelper.AbilityList.Count(); i++)
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
        // remove the hero title from string for just code itself
        var result = sb.ToString();
        var newLineStart = result.IndexOf('\n');
        if(newLineStart >= 0)
            result = result.Substring(newLineStart + 1);

        sb.Clear().Append(result);
        return sb;
    }

    private void SetRewardValues(player player)
    {
        foreach (var value in DecodeOldsave.decodeValues)
        {
            var decodedValue = Decode(value.Value);
            if(value.Key is Awards && decodedValue == 1)
            {
                AwardManager.GiveReward(player, (Awards)value.Key);
            }
            if (value.Key is string key)
            {
                if (Enum.TryParse<RoundTimes>(key, true, out RoundTimes roundtime))
                {
                    var roundstats = Globals.ALL_KITTIES[player].SaveData.GameTimes;
                    roundstats[roundtime] = decodedValue;
                }
                else if(Enum.TryParse<StatTypes>(key, true, out StatTypes stats))
                {
                    var kittyStats = Globals.ALL_KITTIES[player].SaveData.GameStats;
                    kittyStats[stats] = decodedValue;
                }
            }
        }

    }

    private static int SCommHash(string name)
    {
        var charlen = player_charset.Length;
        var count = new List<int>(new int[charlen]);
        var x = 0;
        foreach (var c in name.ToUpper())
        {
            x = OldSavesHelper.Player_CharToInt(c);
            if (x >= 0) count[x]++;
        }

        x = 0;

        for (var i = 0; i < charlen; i++)
            x = count[i] * count[i] * i + count[i] * x + x + 199;

        if (x < 0)
            x = -x;

        return x;
    }

    private static int BASE() => charset.Length;
    private static int HASHN() => 5000;

    private static int Modb(int x)
    {
        if (x >= BASE()) return x - BASE();
        else if (x < 0) return x + BASE();
        return x;
    }


}