import { ServiceManager } from 'Services'
import { createEvent, createTimer } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { hooks } from 'core/API/GeneralHooks'
import { globals } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'

let dialChoixModeCoop: dialog
let dialBoutonAppuye: boolean
const DIAL_TIME_TO_ANSWER = 10
let dialTimerTempLimite: timer

export const InitTrig_creation_dialogue = () => {
    createTimer(0, false, () => {
        dialChoixModeCoop = Natives.UDialogCreate()
        dialTimerTempLimite = CreateTimer()
        DialogSetMessageBJ(dialChoixModeCoop, 'Choose a game mode for everybody')
        const btnChoixCoop = DialogAddButton(dialChoixModeCoop, 'Coop (you can revive allies)', 0)
        DialogAddButton(dialChoixModeCoop, 'Solo', 0)

        createEvent({
            events: [t => TriggerRegisterDialogEventBJ(t, dialChoixModeCoop)],
            actions: [
                () => {
                    globals.coopModeActive = GetClickedButton() === btnChoixCoop
                    dialBoutonAppuye = true
                    if (globals.coopModeActive) {
                        DisplayTextToForce(Natives.UGetPlayersAll(), 'Coop mode chosen by first player')
                    } else {
                        DisplayTextToForce(Natives.UGetPlayersAll(), 'Solo mode chosen by first player')
                    }

                    if (!!hooks.hooks_onModeSelection) {
                        for (const hook of hooks.hooks_onModeSelection.getHooks()) {
                            hook.execute(globals.coopModeActive ? 'coop' : 'solo')
                        }
                    }

                    ServiceManager.getService('Multiboard').resetRoundScores()
                },
            ],
        })
    })
}

export const gg_trg_apparition_dialogue_et_fermeture_automatique = createEvent({
    events: [t => TriggerRegisterTimerEventSingle(t, 1)],
    actions: [
        () => {
            //détermination du premier joueur
            let i = 0
            while (true) {
                if (
                    (GetPlayerController(Natives.UPlayer(i)) === MAP_CONTROL_USER &&
                        GetPlayerSlotState(Natives.UPlayer(i)) === PLAYER_SLOT_STATE_PLAYING) ||
                    i > Constants.NB_PLAYERS_MAX - 1
                )
                    break
                i = i + 1
            }
            if (i > Constants.NB_PLAYERS_MAX - 1) {
                return
            }
            const udg_joueurDialogue = Natives.UPlayer(i)
            DialogDisplay(udg_joueurDialogue, dialChoixModeCoop, true)
            dialBoutonAppuye = false
            TimerStart(dialTimerTempLimite, DIAL_TIME_TO_ANSWER, false, () => {
                if (!dialBoutonAppuye) {
                    DialogDisplay(udg_joueurDialogue, dialChoixModeCoop, false)
                    if (globals.coopModeActive) {
                        DisplayTextToForce(Natives.UGetPlayersAll(), 'Coop mode automatically chosen')
                    } else {
                        DisplayTextToForce(Natives.UGetPlayersAll(), 'Solo mode automatically chosen')
                    }

                    if (!!hooks.hooks_onModeSelection) {
                        for (const hook of hooks.hooks_onModeSelection.getHooks()) {
                            hook.execute(globals.coopModeActive ? 'coop' : 'solo')
                        }
                    }

                    ServiceManager.getService('Multiboard').resetRoundScores()
                }
            })
        },
    ],
})
