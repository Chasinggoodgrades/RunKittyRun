export const SoundPlay3DUnit = (path: string, duration: number) => {
    const sd = CreateSound(path, false, true, true, 10, 10, 'CombatSoundsEAX')

    if (!sd) {
        throw new Error(`Could not create sound from path: "${path}"`)
    }

    SetSoundDuration(sd, duration)
    //Things that must be performed immediately upon creation of sounds
    SetSoundChannel(sd, 5)
    SetSoundVolume(sd, 127)
    SetSoundPitch(sd, 1)
    //These are settings necessary for 3-D sounds to function properly
    SetSoundDistances(sd, 600, 10000)
    SetSoundDistanceCutoff(sd, 3000)
    SetSoundConeAngles(sd, 0, 0, 127)
    SetSoundConeOrientation(sd, 0, 0, 0)

    return sd
}

export const RunSoundOnUnit = (path: string, duration: number, u: unit) => {
    const sd = SoundPlay3DUnit(path, duration)
    AttachSoundToUnit(sd, u)
    StartSound(sd)
    KillSoundWhenDone(sd)
}

/** For what is seen somewhere without a unit standing there - an effect, for instance */
export const RunSoundAtPoint = (path: string, duration: number, x: number, y: number, z = 0) => {
    const sd = SoundPlay3DUnit(path, duration)
    SetSoundPosition(sd, x, y, z)
    StartSound(sd)
    KillSoundWhenDone(sd)
}
