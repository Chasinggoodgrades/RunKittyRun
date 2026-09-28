import { forRange } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { udg_colorCode } from 'core/01_libraries/Init_colorCodes'
import { Text } from 'core/01_libraries/Text'
import { getUdgEscapers } from '../../../../globals'
import { playerId2colorId } from '../../06_COMMANDS/Helpers/Command_functions'
import { Natives } from '../../wc3_natives_unsecured/Natives'

const initMessageHeroDies = () => {
    const MESSAGE_DURATION = 6
    const TIME_BETWEEN_DEATH_AND_MESSAGE = 5
    let timerSonJoue = CreateTimer()
    let isSoundPlaying = false
    let DUREE_SON = 3

    const GetRandomSoundHeroDies = (): sound => {
        let n = GetRandomInt(0, 3)
        if (n === 0) {
            return gg_snd_heroDies0
        } else if (n === 1) {
            return gg_snd_heroDies1
        } else if (n === 2) {
            return gg_snd_heroDies2
        } else {
            return gg_snd_heroDies3
        }
    }

    const GetRandomSoundAllyHeroDies = (): sound => {
        let n = GetRandomInt(0, 3)
        if (n === 0) {
            return gg_snd_allyHeroDies0
        } else if (n === 1) {
            return gg_snd_allyHeroDies1
        } else if (n === 2) {
            return gg_snd_allyHeroDies2
        } else {
            return gg_snd_allyHeroDies3
        }
    }

    const SoundEnd = () => {
        isSoundPlaying = false
    }

    const PlaySoundHeroDies = (fallenPlayer: player) => {
        if (!isSoundPlaying) {
            forRange(Constants.NB_ESCAPERS, i => {
                // For some reason this still plays the sound even tho the player is ignoring death messages
                if (!getUdgEscapers().get(i)?.isIgnoringDeathMessages()) {
                    if (GetLocalPlayer() === fallenPlayer) {
                        StartSoundForPlayerBJ(Natives.UPlayer(i), GetRandomSoundHeroDies())
                    } else {
                        StartSoundForPlayerBJ(Natives.UPlayer(i), GetRandomSoundAllyHeroDies())
                    }
                }
            })

            isSoundPlaying = true
            TimerStart(timerSonJoue, DUREE_SON, false, SoundEnd)
        }
    }

    const DisplayDeathMessagePlayer = (p: player) => {
        const n = GetPlayerId(p)

        TimerStart(CreateTimer(), TIME_BETWEEN_DEATH_AND_MESSAGE, false, () => {
            PlaySoundHeroDies(Natives.UPlayer(n))

            forRange(Constants.NB_ESCAPERS, i => {
                if (!getUdgEscapers().get(i)?.isIgnoringDeathMessages()) {
                    const targetEscaper = getUdgEscapers().get(n)

                    // When players leave their escaper gets removed so we dont show a death message
                    if (targetEscaper) {
                        Text.P_timed(
                            Natives.UPlayer(i),
                            MESSAGE_DURATION,
                            udg_colorCode[playerId2colorId(n)] + targetEscaper.getDisplayName() + '|r has fallen.'
                        )
                    }
                }
            })

            DestroyTimer(Natives.UGetExpiredTimer())
        })
    }

    return { DisplayDeathMessagePlayer }
}

export const MessageHeroDies = initMessageHeroDies()
