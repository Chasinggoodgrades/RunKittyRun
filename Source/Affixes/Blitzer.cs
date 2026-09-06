using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Blitzer : Affix
{
    private static readonly int GHOST_VISIBLE = FourCC("Aeth");
    private static readonly Predicate<Affix> IsBlitzer = x => x is Blitzer;
    private const int AFFIX_ABILITY = Constants.ABILITY_BLITZER;
    private const string BLITZER_EFFECT = "war3mapImported\\ChargerCasterArt.mdx";
    private const float BLITZER_SPEED = 650.0f;
    private const float BLITZER_OVERHEAD_DELAY = 1.50f;
    private const float BLITZER_LOWEND = 6.0f;
    private const float BLITZER_HIGHEND = 11.0f;
    private int Type;
    private float TargetX;
    private float TargetY;
    private AchesTimers MoveTimer;
    private AchesTimers BlitzerTimer;
    private AchesTimers PreBlitzerTimer;
    private effect Effect;
    private effect WanderEffect;

    public Blitzer(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_YELLOW}Blitzer|r";
        Type = GetRandomInt(0, 1);
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.WanderTimer?.Pause();
        Unit.OverheadEffectPath = "";
        Unit.Unit.SetVertexColor(224, 224, 120);
        RegisterMoveTimer();
        base.Apply();
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.WanderTimer?.Resume();
        Unit.OverheadEffectPath = Wolf.DefaultOverheadEffect;

        GC.RemoveEffect(ref WanderEffect);
        BlitzerTimer?.Dispose();
        MoveTimer?.Dispose();
        PreBlitzerTimer?.Dispose();
        BlitzerTimer = null;
        MoveTimer = null;
        PreBlitzerTimer = null;
        GC.RemoveEffect(ref Effect);
        EndBlitz();
        Unit.Unit.SetVertexColor(150, 120, 255, 255);
        Unit.Unit.SetColor(playercolor.Brown);
        base.Remove();
    }

    private void RegisterMoveTimer()
    {
        MoveTimer = ObjectPool<AchesTimers>.GetEmptyObject();
        PreBlitzerTimer = ObjectPool<AchesTimers>.GetEmptyObject();
        var randomFlyTime = GetRandomReal(4.0f, 10.0f); // random time to move before blitzing
        MoveTimer?.Timer.Start(randomFlyTime, false, PreBlitzerMove); // initial move
        BlitzerTimer = ObjectPool<AchesTimers>.GetEmptyObject();
    }

    private void PreBlitzerMove()
    {
        try
        {
            if (Unit.IsPaused)
            {
                MoveTimer?.Timer.Start(GetRandomReal(3.0f, 10.0f), false, PreBlitzerMove);
                return;
            }
            WanderEffect ??= effect.Create(Unit.OverheadEffectPath, Unit.Unit, "overhead");
            WanderEffect.PlayAnimation(ANIM_TYPE_STAND);
            Unit.Unit.SetVertexColor(255, 255, 0);
            Unit.Unit.SetColor(playercolor.Yellow);
            Unit.Unit.SetPathing(false);
            PreBlitzerTimer?.Timer.Start(BLITZER_OVERHEAD_DELAY, false, BeginBlitz);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in PreBlitzerMove: {e.Message}");
            throw;
        }
    }

    private void BeginBlitz()
    {
        try
        {
            var randomTime = GetRandomReal(BLITZER_LOWEND, BLITZER_HIGHEND); // blitz randomly between this time interval

            if (Type == 1) {
                var kitty = GetKittyInZone();
                if (kitty != null)
                {
                    TargetX = kitty.Unit.X;
                    TargetY = kitty.Unit.Y;
                }
                else
                {
                    TargetX = GetRandomReal(Unit.WolfArea.Rect.MinX, Unit.WolfArea.Rect.MaxX);
                    TargetY = GetRandomReal(Unit.WolfArea.Rect.MinY, Unit.WolfArea.Rect.MaxY);
                }
            }
            else
            {
                TargetX = GetRandomReal(Unit.WolfArea.Rect.MinX, Unit.WolfArea.Rect.MaxX);
                TargetY = GetRandomReal(Unit.WolfArea.Rect.MinY, Unit.WolfArea.Rect.MaxY);
            }
            WanderEffect?.PlayAnimation(ANIM_TYPE_DEATH);
            BlitzerMove();
            Unit.Unit.RemoveAbility(GHOST_VISIBLE); // ghost visible
            Effect ??= effect.Create(BLITZER_EFFECT, Unit.Unit, "origin");
            Effect?.PlayAnimation(ANIM_TYPE_STAND);
            Unit.IsWalking = true;
            MoveTimer?.Timer.Start(randomTime, false, PreBlitzerMove);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in BeginBlitz: {e.Message}");
            throw;
        }
    }

    private Kitty GetKittyInZone()
    {
        for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
        {
            var kitty = Globals.ALL_KITTIES_LIST[i];
            if (!kitty.Alive) continue;
            if (Unit.WolfArea.Region.Contains(kitty.Unit.X, kitty.Unit.Y))
            {
                Globals.TempKittyList.Add(kitty);
            }
        }
        if (Globals.TempKittyList.Count == 0) return null;
        var randomIndex = GetRandomInt(0, Globals.TempKittyList.Count - 1);
        var selectedKitty = Globals.TempKittyList[randomIndex];
        Globals.TempKittyList.Clear();
        return selectedKitty;
    }

    private void BlitzerMove()
    {
        var speed = BLITZER_SPEED; // speed in yards per second
        float currentX = Unit.Unit.X;
        float currentY = Unit.Unit.Y;

        // Distance between current and target pos
        float distance = WCSharp.Shared.FastUtil.DistanceBetweenPoints(currentX, currentY, TargetX, TargetY);

        // stop if its within range of the target / collision thingy
        if (distance <= CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS)
        {
            EndBlitz();
            return;
        }

        // determine direction
        float directionX = (TargetX - currentX) / distance;
        float directionY = (TargetY - currentY) / distance;

        // 60 fps for smooth movement, step distance
        float stepDistance = speed / 50.0f; // Assuming 60 calls per second
        float nextX = currentX + (directionX * stepDistance);
        float nextY = currentY + (directionY * stepDistance);

        // Move the unit one step
        Unit.Unit.SetPosition(nextX, nextY);
        //Unit.Unit.SetPathing(true);

        Unit.Unit.SetFacing((float)(Math.Atan2(directionY, directionX) * 180.0 / Math.PI));
        Unit.Unit.SetAnimation(2); // running animation

        var stepTime = 1.0f / 50.0f;

        // Set a timer to call this method again after a short delay
        BlitzerTimer?.Timer.Start(stepTime, false, BlitzerMove);
    }

    private void EndBlitz()
    {
        BlitzerTimer?.Pause();
        Effect?.PlayAnimation(ANIM_TYPE_DEATH);
        Unit.Unit.SetAnimation(0);
        Unit.Unit.SetVertexColor(224, 224, 120);
        Unit.Unit.SetColor(playercolor.Brown);
        Unit.Unit.SetPathing(true);
        Unit.IsWalking = false;
        Unit.Unit.AddAbility(GHOST_VISIBLE);
    }

    public static Blitzer GetBlitzer(unit unit)
    {
        if (unit == null) return null;
        var affix = Globals.ALL_WOLVES[unit].Affixes.Find(IsBlitzer);
        return affix is Blitzer blitzer ? blitzer : null;
    }

    public override void Pause(bool pause)
    {
        if (pause)
        {
            BlitzerTimer?.Pause();
            PreBlitzerTimer?.Pause();
            WanderEffect?.PlayAnimation(ANIM_TYPE_DEATH);
            MoveTimer?.Pause();
            Unit.IsWalking = !pause;
        }
        else
        {
            BlitzerTimer?.Resume();
            PreBlitzerTimer?.Resume();
            MoveTimer?.Resume();
            Unit.IsWalking = !pause;
        }
    }
}
