import { Text } from '../../01_libraries/Text'
import { setImmolationSystemEnabled } from '../../04_STRUCTURES/Monster/Immolation_system'
import { setContactCheckEnabledForEveryHero } from '../../08_GAME/Contact/ContactCheck'
import { E2EAction, E2ETest } from './base/e2e-tests-base'

/**
 * Both tests below leave the game in the state they just set: they are made to be watched and
 * played with, and each one is the way back from the other.
 */

const removeImmolationActions: E2EAction[] = [
    {
        function: () => {
            const nbChangedUnits = setImmolationSystemEnabled(false)

            Text.mkA_timed(
                -1,
                `\nImmolation removed from ${nbChangedUnits} monster units, spawned ones included.` +
                    `\nThe monsters created from now on get none either.`
            )
        },
    },
]

const restoreImmolationActions: E2EAction[] = [
    {
        function: () => {
            const nbChangedUnits = setImmolationSystemEnabled(true)

            Text.mkA_timed(-1, `\nImmolation given back to ${nbChangedUnits} monster units, spawned ones included`)
        },
    },
]

export const removeImmolation: E2ETest = {
    shortName: 'immolationOff',
    name: 'Removal of the immolation of every monster',
    actions: removeImmolationActions,
}

export const restoreImmolation: E2ETest = {
    shortName: 'immolationOn',
    name: 'Normal immolation system back',
    actions: restoreImmolationActions,
}

const contactCheckForEveryHeroActions: E2EAction[] = [
    {
        function: () => {
            setContactCheckEnabledForEveryHero(true)

            Text.mkA_timed(
                -1,
                `\nOur own contact check now looks for what every hero touches, sliding async or not.` +
                    `\nRun "immolationOff" as well, or every contact is handled twice.`
            )
        },
    },
]

const contactCheckForAsyncSlidesOnlyActions: E2EAction[] = [
    {
        function: () => {
            setContactCheckEnabledForEveryHero(false)

            Text.mkA_timed(
                -1,
                `\nOur own contact check is back to the heroes an effect carries only.` +
                    `\nRun "immolationOn" as well if the immolation is still off.`
            )
        },
    },
]

export const contactCheckForEveryHero: E2ETest = {
    shortName: 'contactCheckOn',
    name: 'Our own contact check for every hero',
    actions: contactCheckForEveryHeroActions,
}

export const contactCheckForAsyncSlidesOnly: E2ETest = {
    shortName: 'contactCheckOff',
    name: 'Our own contact check for the async slides only',
    actions: contactCheckForAsyncSlidesOnlyActions,
}
