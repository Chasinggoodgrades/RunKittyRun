using WCSharp.Api;
using System;
using static WCSharp.Api.Common;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using System.Collections;

public class Savecode
{
    public static string charset = "!$%&'()*+,-.0123456789:;=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}`";
    private static string player_charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    public double Digits { get; private set; } // logarithmic approximation
    public BigNum Bignum { get; private set; }
    public Savecode()
    {
        Digits = 0.0;
        Bignum = new BigNum(BASE());
    }
    public static Savecode Create() => new Savecode();
    public int Decode(int max) => Bignum.DivSmall(max + 1);
    public double Length() => Digits;
    public void Clean() => Bignum.Clean();
    public void FromString(string s)
    {
        int i = s.Length - 1;
        BigNumL cur = BigNumL.Create();
        Bignum.List = cur;

        while (true)
        {
            cur.Leaf = OldSavesHelper.CharToInt(s[i]);
            Console.WriteLine("cur.Leaf: " + cur.Leaf);
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
            int key = SCommHash("Aches#1817") + loadtype * 73;
            int inputhash = 0;

            Console.WriteLine("Key: " + key);

            FromString(s);
            Obfuscate(key, -1);
            inputhash = Decode(HASHN());
            Console.WriteLine(inputhash);
            Clean();

            if(inputhash == Hash())
            {
                DecodingBegin(Player(0));
            }

            return inputhash == Hash();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return false;
        }
    }

    private void DecodingBegin(player player)
    {
        foreach (var value in DecodeOldsave.decodeValues)
        {
            if(value.Key is Awards)
            {
                AwardManager.GiveReward(player, (Awards)value.Key);
            }
            else if(value.Key is string)
            {
                if (Enum.TryParse(value.Key.ToString(), true, out RoundTimes roundtime))
                    Console.WriteLine($"Setting {value.Key.ToString()} to {value.Value}");
                else if (Enum.TryParse(value.Key.ToString(), true, out StatTypes stattype))
                    Console.WriteLine($"Setting {value.Key.ToString()} to {value.Value}");
                else
                    Console.WriteLine($"Invalid key value: {value.Key.ToString()}");
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