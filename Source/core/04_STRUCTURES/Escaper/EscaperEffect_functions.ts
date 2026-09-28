const initEscaperEffectFunctions = () => {
    const String2BodyPartStr = (s: string) => {
        if (s == 'leftHand' || s == 'lh') {
            return 'hand left'
        }

        if (s == 'rightHand' || s == 'rh') {
            return 'hand right'
        }

        if (s == 'leftFoot' || s == 'lf') {
            return 'foot left'
        }

        if (s == 'rightFoot' || s == 'rf') {
            return 'foot right'
        }

        if (s == 'overhead' || s == 'oh') {
            return 'overhead'
        }

        if (s == 'head' || s == 'h') {
            return 'head'
        }

        if (s == 'origin' || s == 'o') {
            return 'origin'
        }

        if (s == 'chest' || s == 'c') {
            return 'chest'
        }

        return null
    }

    const IsBodyPartStr = (s: string) => {
        return String2BodyPartStr(s) != null
    }

    const String2EffectStr = (s: string) => {
        if (s == 'light' || s == 'l') {
            return 'Abilities\\Weapons\\FarseerMissile\\FarseerMissile.mdl'
        }

        if (s == 'fire' || s == 'f') {
            return 'Abilities\\Spells\\Items\\AIfb\\AIfbTarget.mdl'
        }

        if (s == 'ice' || s == 'i') {
            return 'Abilities\\Spells\\Items\\AIob\\AIobTarget.mdl'
        }

        if (s == 'corruption' || s == 'c') {
            return 'Abilities\\Spells\\Items\\OrbCorruption\\OrbCorruption.mdl'
        }

        if (s == 'poison' || s == 'p') {
            return 'Abilities\\Spells\\Items\\OrbVenom\\OrbVenom.mdl'
        }

        if (s == 'slow' || s == 's') {
            return 'Abilities\\Spells\\Items\\OrbSlow\\OrbSlow.mdl'
        }

        return null
    }

    const IsEffectStr = (s: string) => {
        return String2EffectStr(s) != null
    }

    return {
        String2BodyPartStr,
        IsBodyPartStr,
        String2EffectStr,
        IsEffectStr,
    }
}

export const EscaperEffectFunctions = initEscaperEffectFunctions()
