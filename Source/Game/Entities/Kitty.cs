using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Kitty
{
    private const int KITTY_HERO_TYPE = Constants.UNIT_KITTY;
    private const string SPAWN_IN_EFFECT = "Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl";
    private const float MANA_DEATH_PENALTY = 60.0f;
    private effect Effect { get; set; }
    public player Player { get; }
    public unit Unit { get; set; }
    public int TeamID { get; set; } = 0;
    public int Saves { get; set; } = 0;
    public int SaveStreak { get; set; } = 0;
    public int Deaths { get; set; } = 0;
    public int ProgressZone { get; set; } = 0;
    public bool Alive { get; set; } = true;
    public bool Finished { get; set; } = false;
    public int Games { get; set; } = 0;
    public List<item> Relics { get; set; }
    public bool CanBuyRelic { get; set; } = false;
    public trigger w_Collision { get; set; } = CreateTrigger();
    public trigger c_Collision { get; set; } = CreateTrigger();
    public float Progress { get; set; } = 0.0f;
    public Dictionary<int, float> Time { get; set; } = new Dictionary<int, float>();

    public Kitty(player player)
    {
        Player = player;
        SpawnEffect();
        CreateKitty();
        InitRoundStats();
    }

    public static void Initialize()
    {
        try {
            foreach (var player in Globals.ALL_PLAYERS)
            {
                new Kitty(player);
                new Circle(player);
            }
        } 
        catch (Exception e) {
            Console.WriteLine(e.Message);
        }
    }
    private void DelayCreateKitty()
    {
        timer t = CreateTimer();
        var delayTime = 2.0f;
        TimerStart(t, delayTime, false, () =>
        {
            CreateKitty();
            t.Dispose();
        });
    }

    private void InitRoundStats()
    {
        for(int i = 1; i <= Gamemode.NumberOfRounds; i++)
            Time.Add(i, 0.0f);
        if(Gamemode.CurrentGameMode == "Standard") Relics = new List<item>();
    }
    private void SpawnEffect()
    {
        var spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Effect = effect.Create(SPAWN_IN_EFFECT, spawnCenter.X, spawnCenter.Y);
        Effect.Dispose();
    }
    private void CreateKitty()
    {
        var spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Unit = unit.Create(Player, KITTY_HERO_TYPE, spawnCenter.X, spawnCenter.Y, 360);
        Utility.MakeUnitLocust(Unit);
        Globals.ALL_KITTIES.Add(Player, this);
        CollisionDetection.KittyRegisterCollisions(this);
    }

    public void RemoveKitty()
    {
        Dispose();
    }

    public void Dispose()
    {
        Unit.Dispose();
        w_Collision.Dispose();
        c_Collision.Dispose();
        Globals.ALL_KITTIES.Remove(Player);
    }

    public void ReviveKitty(Kitty savior = null)
    {
        var circle = Globals.ALL_CIRCLES[Player];
        circle.HideCircle();
        Alive = true;
        Unit.Revive(Unit.X, Unit.Y, false);
        Unit.Mana = circle.Unit.Mana;
        Utility.SelectUnitForPlayer(Player, Unit);
        if(savior == null) return;
        savior.Saves += 1;
        savior.SaveStreak += 1;
        savior.Player.Gold += Resources.SaveGold;
        savior.Unit.Experience += Resources.SaveExperience;
    }

    public void KillKitty()
    {
        var circle = Globals.ALL_CIRCLES[Player];
        Unit.Kill();
        Alive = false;
        Deaths += 1;
        SaveStreak = 0;
        circle.SetMana(Unit.Mana - MANA_DEATH_PENALTY, Unit.MaxMana, (Unit.Intelligence * 0.08f) + 0.01f);
        circle.KittyDied(this);
        SoundManager.PlayKittyDeathSound(Unit);
    }

    public static void RoundResetAll()
    {
        foreach(var kitty in Globals.ALL_KITTIES.Values)
        {
            kitty.Unit.Revive(RegionList.SpawnRegions[kitty.Player.Id].Center.X, RegionList.SpawnRegions[kitty.Player.Id].Center.Y, false);
            Globals.ALL_CIRCLES[kitty.Player].HideCircle();
            kitty.Alive = true;
            kitty.ProgressZone = 0;
            kitty.Progress = 0.0f;
            kitty.Finished = false;
            kitty.Unit.Mana = kitty.Unit.MaxMana;
        }

    }

}
