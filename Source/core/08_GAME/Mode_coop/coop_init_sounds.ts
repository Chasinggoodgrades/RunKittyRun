import { RunSoundOnUnit } from '../../02_bibliotheques_externes/SoundUtils'

export function RunCoopSoundOnHero(hero: unit) {
    RunSoundOnUnit('war3mapImported\\goutte.wav', 280, hero)
}
