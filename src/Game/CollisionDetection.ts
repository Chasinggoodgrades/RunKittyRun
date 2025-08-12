export class CollisionDetection {
    public DEFAULT_WOLF_COLLISION_RADIUS: number = 74.0
    private CIRCLE_COLLISION_RADIUS: number = 78.0

    private static IsBeaconOfUnitedLifeforce = (r: Relic): r is BeaconOfUnitedLifeforce => {
        return r instanceof BeaconOfUnitedLifeforce
    }

    private static WolfCollisionFilter(k: Kitty): Func<bool> {
        return () => {
            return GetFilterUnit().UnitType == Constants.UNIT_CUSTOM_DOG && k.Alive && GetFilterUnit().Alive // wolf should be alive too (exploding / stan wolf)
        }
    }

    private static ShadowRelicWolvesFilter(sk: ShadowKitty): Func<bool> {
        return () => {
            return GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG && sk.Unit.Alive
        }
    }

    private static ShadowRelicCircleFilter(sk: ShadowKitty): Func<bool> {
        return () => {
            return (
                GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE &&
                GetFilterUnit().Owner != sk.Player && // Not Same Player
                sk.Unit.Alive && // Has to Be Alive
                Globals.ALL_KITTIES[GetFilterUnit().Owner].TeamID == Globals.ALL_KITTIES[sk.Player].TeamID
            ) // Must be same team
        }
    }

    private static CircleCollisionFilter(k: Kitty): Func<bool> {
        return () => {
            return (
                GetFilterUnit().UnitType == Constants.UNIT_KITTY_CIRCLE &&
                GetFilterUnit().Owner != k.Player && // Not Same Player
                k.Alive && // Has to Be Alive
                Globals.ALL_KITTIES[GetFilterUnit().Owner].TeamID == Globals.ALL_KITTIES[k.Player].TeamID && // Must be same team
                Gamemode.CurrentGameMode != GameMode.SoloTournament
            ) // Not Solo Mode
        }
    }

    public static KittyRegisterCollisions(k: Kitty) {
        let WOLF_COLL_RADIUS = k.CurrentStats.CollisonRadius
        k.w_Collision ??= CreateTrigger()
        k.c_Collision ??= CreateTrigger()

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
        sk.wCollision ??= CreateTrigger()
        sk.cCollision ??= CreateTrigger()

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

    private static WolfCollisionTrigger(k: Kitty): trigger {
        TriggerAddAction(k.w_Collision, () => {
            try {
                if (!k.Unit.Alive) return
                if (NamedWolves.ExplodingWolfCollision(GetFilterUnit(), k)) return
                if (Globals.ALL_WOLVES[GetFilterUnit()].IsReviving) return // bomber wolf
                if (ChronoSphere.RewindDeath(k)) return
                if (k.Invulnerable) return
                OneOfNine.OneOfNineEffect(k)
                k.KillKitty()
                TeamsUtil.CheckTeamDead(k)
            } catch (e) {
                Logger.Warning('Error: WolfCollisionTrigger: {e.Message}')
                throw e
            }
        })
        return k.w_Collision
    }

    private static CircleCollisionTrigger(k: Kitty): trigger {
        TriggerAddAction(k.c_Collision, () => {
            try {
                let circle = Globals.ALL_KITTIES[GetFilterUnit().Owner]
                circle
                    .ReviveKitty(k)(k.Relics.Find(CollisionDetection.IsBeaconOfUnitedLifeforce))
                    ?.BeaconOfUnitedLifeforceEffect(k.Player)
            } catch (e) {
                Logger.Warning('Error: CircleCollisionTrigger: {e.Message}')
                throw e
            }
        })
        return k.c_Collision
    }

    private static WolfCollisionShadowTrigger(sk: ShadowKitty): trigger {
        TriggerAddAction(sk.wCollision, () => {
            if (NamedWolves.ExplodingWolfCollision(GetFilterUnit(), sk.Kitty, true)) return // Floating text will appear on kitty instead of SK tho.
            sk.KillShadowKitty()
        })
        return sk.wCollision
    }

    private static CircleCollisionShadowTrigger(sk: ShadowKitty): trigger {
        TriggerAddAction(sk.cCollision, () => {
            try {
                let circle = Globals.ALL_KITTIES[GetOwningPlayer(GetFilterUnit())]
                let saviorKitty = Globals.ALL_KITTIES[sk.Player]
                circle.ReviveKitty(saviorKitty)
            } catch (e) {
                Logger.Warning('Error: CircleCollisionShadowTrigger: {e.Message}')
                throw e
            }
        })
        return sk.cCollision
    }
}
