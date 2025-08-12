import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'

export class Blitzer extends Affix {
    private static readonly GHOST_VISIBLE: number = FourCC('Aeth')

    private static readonly IsBlitzer = (r: Affix): r is Blitzer => {
        return r instanceof Blitzer
    }

    private AFFIX_ABILITY: number = Constants.ABILITY_BLITZER
    private BLITZER_EFFECT: string = 'war3mapImported\\ChargerCasterArt.mdx'
    private BLITZER_SPEED: number = 650.0
    private BLITZER_OVERHEAD_DELAY: number = 1.5
    private BLITZER_LOWEND: number = 6.0
    private BLITZER_HIGHEND: number = 11.0
    private TargetX: number
    private TargetY: number
    private MoveTimer: AchesTimers
    private BlitzerTimer: AchesTimers
    private PreBlitzerTimer: AchesTimers
    private Effect: effect
    private WanderEffect: effect

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_YELLOW}Blitzer|r'
    }

    public override Apply() {
        UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        Unit.WanderTimer?.pause()
        Unit.OVERHEAD_EFFECT_PATH = ''
        Unit.Unit.SetVertexColor(224, 224, 120)
        RegisterMoveTimer()
        super.Apply()
    }

    public override Remove() {
        UnitRemoveAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        Unit.WanderTimer?.Resume()
        Unit.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT

        GC.RemoveEffect(WanderEffect) // TODO; Cleanup:         GC.RemoveEffect(ref WanderEffect);
        BlitzerTimer?.Dispose()
        MoveTimer?.Dispose()
        PreBlitzerTimer?.Dispose()
        BlitzerTimer = null
        MoveTimer = null
        PreBlitzerTimer = null
        GC.RemoveEffect(Effect) // TODO; Cleanup:         GC.RemoveEffect(ref Effect);
        EndBlitz()
        Unit.Unit.SetVertexColor(150, 120, 255, 255)
        Unit.Unit.setColor(playercolor.Brown)
        super.Remove()
    }

    private RegisterMoveTimer() {
        MoveTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        PreBlitzerTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        let randomFlyTime = GetRandomReal(4.0, 10.0) // random time to move before blitzing
        MoveTimer?.Timer.start(randomFlyTime, false, PreBlitzerMove) // initial move
        BlitzerTimer = MemoryHandler.getEmptyObject<AchesTimers>()
    }

    private PreBlitzerMove() {
        try {
            if (Unit.IsPaused) {
                MoveTimer?.Timer.start(GetRandomReal(3.0, 10.0), false, PreBlitzerMove)
                return
            }
            WanderEffect ??= Effect.create(Wolf.DEFAULT_OVERHEAD_EFFECT, Unit.Unit, 'overhead')!
            WanderEffect.PlayAnimation(ANIM_TYPE_STAND)
            Unit.Unit.SetVertexColor(255, 255, 0)
            Unit.Unit.setColor(playercolor.Yellow)
            PreBlitzerTimer?.Timer.start(BLITZER_OVERHEAD_DELAY, false, BeginBlitz)
        } catch (e) {
            Logger.Warning('Error in PreBlitzerMove: {e.Message}')
            throw e
        }
    }

    private BeginBlitz() {
        try {
            let randomTime = GetRandomReal(BLITZER_LOWEND, BLITZER_HIGHEND) // blitz randomly between this time interval
            TargetX = GetRandomReal(Unit.WolfArea.Rect.MinX, Unit.WolfArea.Rect.MaxX)
            TargetY = GetRandomReal(Unit.WolfArea.Rect.MinY, Unit.WolfArea.Rect.MaxY)
            WanderEffect?.PlayAnimation(ANIM_TYPE_DEATH)
            BlitzerMove()
            UnitRemoveAbility(this.Unit.Unit, this.GHOST_VISIBLE) // ghost visible
            Effect ??= Effect.create(BLITZER_EFFECT, Unit.Unit, 'origin')!
            Effect?.PlayAnimation(ANIM_TYPE_STAND)
            Unit.IsWalking = true
            MoveTimer?.Timer.start(randomTime, false, PreBlitzerMove)
        } catch (e) {
            Logger.Warning('Error in BeginBlitz: {e.Message}')
            throw e
        }
    }

    private BlitzerMove() {
        let speed = BLITZER_SPEED // speed in yards per second
        let currentX: number = Unit.Unit.X
        let currentY: number = Unit.unit.y

        // Distance between current and target pos
        let distance: number = WCSharp.Shared.FastUtil.DistanceBetweenPoints(currentX, currentY, TargetX, TargetY)

        // stop if its within range of the target / collision thingy
        if (distance <= CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS) {
            EndBlitz()
            return
        }

        // determine direction
        let directionX: number = (TargetX - currentX) / distance
        let directionY: number = (TargetY - currentY) / distance

        // 60 fps for smooth movement, step distance
        let stepDistance: number = speed / 50.0 // Assuming 60 calls per second
        let nextX: number = currentX + directionX * stepDistance
        let nextY: number = currentY + directionY * stepDistance

        // Move the unit one step
        Unit.Unit.SetPathing(false)
        Unit.Unit.setPos(nextX, nextY)
        Unit.Unit.SetPathing(true)

        Unit.Unit.SetFacing((Math.Atan2(directionY, directionX) * 180.0) / Math.PI)
        Unit.Unit.SetAnimation(2) // running animation

        let stepTime = 1.0 / 50.0

        // Set a timer to call this method again after a short delay
        BlitzerTimer?.Timer.start(stepTime, false, BlitzerMove)
    }

    private EndBlitz() {
        BlitzerTimer?.pause()
        Effect?.PlayAnimation(ANIM_TYPE_DEATH)
        Unit.Unit.SetAnimation(0)
        Unit.Unit.SetVertexColor(224, 224, 120)
        Unit.Unit.setColor(playercolor.Brown)
        Unit.IsWalking = false
        UnitAddAbility(this.Unit.Unit, this.GHOST_VISIBLE)
    }

    public static GetBlitzer(unit: Unit): Blitzer {
        if (unit == null) return null
        let affix = Globals.ALL_WOLVES[unit].Affixes.Find(Blitzer.IsBlitzer)
        return affix instanceof Blitzer ? blitzer : null
    }

    public override Pause(pause: boolean) {
        if (pause) {
            BlitzerTimer?.pause()
            PreBlitzerTimer?.pause()
            WanderEffect?.PlayAnimation(ANIM_TYPE_DEATH)
            MoveTimer?.pause()
            Unit.IsWalking = !pause
        } else {
            BlitzerTimer?.Resume()
            PreBlitzerTimer?.Resume()
            MoveTimer?.Resume()
            Unit.IsWalking = !pause
        }
    }
}
