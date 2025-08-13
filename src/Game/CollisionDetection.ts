export class CollisionDetection {
    public DEFAULT_WOLF_COLLISION_RADIUS: number = 74.0
    private CIRCLE_COLLISION_RADIUS: number = 78.0

    private static IsBeaconOfUnitedLifeforce = (r: Relic): r is BeaconOfUnitedLifeforce => {
        return r instanceof BeaconOfUnitedLifeforce
    }

    private static WolfCollisionFilter(k: Kitty): Func<bool> {
        return () => {
            return getFilterUnit().typeId == Constants.UNIT_CUSTOM_DOG && k.isAlive() && getFilterUnit().isAlive() // wolf should be alive too (exploding / stan wolf)
        }
    }

    private static ShadowRelicWolvesFilter(sk: ShadowKitty): Func<bool> {
        return () => {
            return GetUnitTypeId(getFilterUnit()) == Constants.UNIT_CUSTOM_DOG && sk.Unit.isAlive()
        }
    }

    private static ShadowRelicCircleFilter(sk: ShadowKitty): Func<bool> {
        return () => {
            return (
                GetUnitTypeId(getFilterUnit()) == Constants.UNIT_KITTY_CIRCLE &&
                getFilterUnit().owner != sk.Player && // Not Same Player
                sk.Unit.isAlive() && // Has to Be Alive
                Globals.ALL_KITTIES.get(getFilterUnit()!.owner).TeamID == Globals.ALL_KITTIES.get(sk.Player)!.TeamID
            ) // Must be same team
        }
    }

    private static CircleCollisionFilter(k: Kitty): Func<bool> {
        return () => {
            return (
                getFilterUnit().typeId == Constants.UNIT_KITTY_CIRCLE &&
                getFilterUnit().owner != k.Player && // Not Same Player
                k.isAlive() && // Has to Be Alive
                Globals.ALL_KITTIES.get(getFilterUnit()!.owner).TeamID == Globals.ALL_KITTIES.get(k.Player)!.TeamID && // Must be same team
                Gamemode.CurrentGameMode != GameMode.SoloTournament
            ) // Not Solo Mode
        }
    }

    public static KittyRegisterCollisions(k: Kitty) {
        let WOLF_COLL_RADIUS = k.CurrentStats.CollisonRadius
        k.w_Collision ??= Trigger.create()!
        k.c_Collision ??= Trigger.create()!

        UnitWithinRange.RegisterUnitWithinRangeTrigger(
            k.Unit,
            WOLF_COLL_RADIUS,
            WolfCollisionFilter(k),
            WolfCollisionTrigger(k)
        )
        UnitWithinRange.RegisterUnitWithinRangeTrigger(
            k.Unit,
            CIRCLE_COLLISION_RADIUS,
            CircleCollisionFilter(k),
            CircleCollisionTrigger(k)
        )
    }

    public static ShadowKittyRegisterCollision(sk: ShadowKitty) {
        sk.wCollision ??= Trigger.create()!
        sk.cCollision ??= Trigger.create()!

        UnitWithinRange.RegisterUnitWithinRangeTrigger(
            sk.Unit,
            DEFAULT_WOLF_COLLISION_RADIUS,
            ShadowRelicWolvesFilter(sk),
            WolfCollisionShadowTrigger(sk)
        )
        UnitWithinRange.RegisterUnitWithinRangeTrigger(
            sk.Unit,
            CIRCLE_COLLISION_RADIUS,
            ShadowRelicCircleFilter(sk),
            CircleCollisionShadowTrigger(sk)
        )
    }

    private static WolfCollisionTrigger(k: Kitty): Trigger {
        TriggerAddAction(k.w_Collision, () => {
            try {
                if (!k.Unit.isAlive()) return
                if (NamedWolves.ExplodingWolfCollision(getFilterUnit(), k)) return
                if (Globals.ALL_WOLVES[getFilterUnit()].IsReviving) return // bomber wolf
                if (ChronoSphere.RewindDeath(k)) return
                if (k.Invulnerable) return
                OneOfNine.OneOfNineEffect(k)
                k.KillKitty()
                TeamsUtil.CheckTeamDead(k)
            } catch (e: any) {
                Logger.Warning('Error: WolfCollisionTrigger: {e.Message}')
                throw e
            }
        })
        return k.w_Collision
    }

    private static CircleCollisionTrigger(k: Kitty): Trigger {
        TriggerAddAction(k.c_Collision, () => {
            try {
                let circle = Globals.ALL_KITTIES.get(getFilterUnit()!.owner)
                circle
                    .ReviveKitty(k)(k.Relics.find(CollisionDetection.IsBeaconOfUnitedLifeforce))
                    ?.BeaconOfUnitedLifeforceEffect(k.Player)
            } catch (e: any) {
                Logger.Warning('Error: CircleCollisionTrigger: {e.Message}')
                throw e
            }
        })
        return k.c_Collision
    }

    private static WolfCollisionShadowTrigger(sk: ShadowKitty): Trigger {
        TriggerAddAction(sk.wCollision, () => {
            if (NamedWolves.ExplodingWolfCollision(getFilterUnit(), sk.Kitty, true)) return // Floating text will appear on kitty instead of SK tho.
            sk.KillShadowKitty()
        })
        return sk.wCollision
    }

    private static CircleCollisionShadowTrigger(sk: ShadowKitty): Trigger {
        TriggerAddAction(sk.cCollision, () => {
            try {
                let circle = Globals.ALL_KITTIES.get(GetOwningPlayer(getFilterUnit()!))
                let saviorKitty = Globals.ALL_KITTIES.get(sk.Player)!
                circle.ReviveKitty(saviorKitty)
            } catch (e: any) {
                Logger.Warning('Error: CircleCollisionShadowTrigger: {e.Message}')
                throw e
            }
        })
        return sk.cCollision
    }
}
