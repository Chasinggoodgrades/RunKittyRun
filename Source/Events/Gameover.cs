﻿using static WCSharp.Api.Common;
using WCSharp.Api;
using System;
public static class Gameover
{
    public static bool WinGame = false;
    public static bool GameOver()
    {
        if(WinningGame()) return true;
        if (LosingGameCheck()) return true;
        return false;
    }

    private static bool WinningGame()
    {
        if(!WinGame) return false;
        Console.WriteLine("You won!!!");
        StandardWinChallenges();
        ImpossibleChallenges();
        SaveManager.SaveAll();
        return true;
    }

    private static void StandardWinChallenges()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        Challenges.NecroWindwalk();
        Challenges.BlueFire();
        Challenges.PinkFire();
    }

    private static void ImpossibleChallenges()
    {
        if (Difficulty.DifficultyValue != (int)DifficultyLevel.Impossible) return;
        Challenges.WhiteTendrils();
    }

    private static void LosingGame()
    {
        Console.WriteLine("Game will end... eventually..");
        Wolf.RemoveAllWolves();
        SaveManager.SaveAll();
    }

    private static bool LosingGameCheck()
    {
        if (Gamemode.CurrentGameMode != "Standard") return false; 
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            if (kitty.Alive) return false;
        LosingGame();
        return true;
    }
}