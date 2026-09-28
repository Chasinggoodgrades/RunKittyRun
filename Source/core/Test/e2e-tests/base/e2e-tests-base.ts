import { getUdgEscapers } from '../../../../../globals'
import { ServiceManager } from '../../../../Services'
import { errorHandler } from '../../../../Utils/mapUtils'
import { ClearText } from '../../../01_libraries/Basic_functions'
import { SUCCESS_TEXT_COLORCODE, Text } from '../../../01_libraries/Text'
import type { Escaper } from '../../../04_STRUCTURES/Escaper/Escaper'

const sounds = {
    start: 'Sound/Interface/BattleNetTick.flac',
    stop: 'Abilities/Spells/Human/Defend/DefendCaster.flac',
    end: 'Sound/Interface/Rescue.flac',
    step: 'Sound/Interface/InGameChatWhat1.flac',
}

export type E2EAction = {
    command?: string
    function?: () => void
    waitAfter?: number
}

export type E2ETest = {
    shortName: string
    name: string
    actions: E2EAction[]
    abortFunction?: () => void
}

const settings = {
    speed: 1,
    paused: false,
}

let lastExecutedTest: E2ETest | null = null
let currentTest: E2ETest | null = null
let askingForNextStep = false

function executeActions(actions: E2EAction[], testName: string) {
    const firstEscaper = getUdgEscapers().getFirst()
    if (!firstEscaper) {
        print('No escaper found, cannot execute e2e actions')
        return
    }

    // We need a timer for TriggerSleepAction to work, so we create one that executes immediately
    const trigger = CreateTrigger()
    TriggerRegisterTimerEventSingle(trigger, 0)
    TriggerAddAction(trigger, () => {
        ClearText()

        Text.mkA_timed(-1, `Starting ${testName} test`)
        PlaySound(sounds.start)

        for (let i = 0; i < actions.length; i++) {
            ClearText()

            if (i > 0) {
                PlaySound(sounds.step)
            }

            const action = actions[i]

            if (action.command) {
                Text.mkA_timed(-1, `Executing:|r ${action.command}`)
                ServiceManager.getService('Cmd').ExecuteCommand(firstEscaper, action.command)
            }

            if (action.function) {
                errorHandler(() => action.function?.())()
            }

            if (!currentTest) {
                // In case of aborted test
                return
            }

            let n = 0
            while (settings.paused && !askingForNextStep) {
                TriggerSleepAction(0.25)
                if (n % 16 === 0) {
                    // every 4 seconds
                    Text.mkA_timed(-1, `Test paused...`)
                }
                n++
            }

            if (action.waitAfter) {
                if (askingForNextStep) {
                    askingForNextStep = false
                    continue
                }

                const waitTime = action.waitAfter * settings.speed
                Text.mkA_timed(-1, `Waiting for ${waitTime}s...`)

                const intervalTime = 0.25
                const nbWaitingIntervals = Math.ceil(waitTime / intervalTime)
                for (let i = 0; i < nbWaitingIntervals; i++) {
                    TriggerSleepAction(intervalTime)

                    if (askingForNextStep) {
                        askingForNextStep = false
                        break
                    }
                }

                if (!currentTest) {
                    // In case of aborted test
                    return
                }
            }
        }

        ClearText()
        Text.ForAll_timed_withColorCode(-1, SUCCESS_TEXT_COLORCODE, `${testName} test ended.`)
        PlaySound(sounds.end)

        lastExecutedTest = currentTest
        currentTest = null
    })
}

function setSpeed(newSpeed: number) {
    if (newSpeed < 0) {
        Text.erA('Wrong e2e speed "' + newSpeed + '" (has to be a positive percentage')
    }

    settings.speed = 1 / (newSpeed / 100)
    Text.mkA(`E2E test speed set to ${newSpeed}%`)
}

const e2eTests = new Map<string, E2ETest>()

function registerTest(test: E2ETest) {
    e2eTests.set(test.shortName, test)
}

/** Every test that has been registered, named as the -e2e command wants them */
function listTests(escaper: Escaper) {
    const p = escaper.getPlayer()

    Text.mkP(p, `E2E tests (-e2e run <name>):`)

    for (const [shortName, test] of e2eTests) {
        Text.mkP(p, `  ${shortName}|r - ${test.name} (${test.actions.length} steps)`)
    }

    if (currentTest) {
        Text.mkP(p, `currently running: ${currentTest.shortName}`)
    }
}

function startTest(name: string) {
    const test = e2eTests.get(name)
    if (!test) {
        Text.erA(`e2e test "${name}" doesn't exist`)
        return
    }

    stop(false)

    currentTest = test
    executeActions(test.actions, name)
}

function stop(playSound = true) {
    if (currentTest) {
        currentTest.abortFunction?.()
        Text.mkA(`Test "${currentTest.name}" stopped.`)
        lastExecutedTest = currentTest
        currentTest = null

        playSound && PlaySound(sounds.stop)
    } else {
        Text.erA('No e2e test is currently running')
    }
}

function pause() {
    if (!currentTest) {
        Text.erA('No e2e test is currently running')
        return
    }

    settings.paused = true
    Text.mkA(`Test "${currentTest.name}" paused.`)
}

function resume() {
    if (!currentTest) {
        Text.erA('No e2e test is currently running')
        return
    }

    settings.paused = false
    Text.mkA(`Test "${currentTest.name}" resumed.`)
}

function nextStep() {
    if (!currentTest && !lastExecutedTest) {
        Text.erA('No e2e test is currently running')
        return
    }

    if (currentTest) {
        askingForNextStep = true
    } else if (lastExecutedTest) {
        startTest(lastExecutedTest.shortName)
    }
}

export const e2e = {
    setSpeed,
    registerTest,
    listTests,
    startTest,
    stop,
    pause,
    resume,
    nextStep,
}
