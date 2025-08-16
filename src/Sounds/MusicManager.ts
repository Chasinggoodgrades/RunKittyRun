export class MusicManager {
    public static MusicList: Music[]

    public static Initialize() {
        MusicManager.MusicList = MusicManager.RegisterMusicList()
    }

    // The best approach for this was to replace the internal music files with the songs themselves.
    // If you take the approach of creating the sounds themselves, it causes a lot of lag at initialization.

    // Steps: Go into the wc3 editor -> Sound Editor, and replace the internal music file with the song you want.
    // Then place the name of whichever u replaced, and put in here the list below.
    private static RegisterMusicList() {
        return [
            new Music('Stop All Music', ''),
            new Music('Linkin Park - Numb', 'Human1'),
            new Music('Linkin Park - In The End', 'Human2'),
            new Music('Linkin Park - Faint', 'Human3'),
            new Music('The AI - Purrfectly (RKR)', 'Orc1'),
            new Music('Sum 41 - The Hell Song', 'Orc2'),
            new Music('Skillet - Whispers In The Dark', 'Undead2'),
            new Music('DJ Sammy - Heaven', 'Orc3'),
            new Music('Cascada - Everytime We Touch', 'Undead1'),
            new Music('BassHunter - Dota', 'Undead3'),
        ]
    }

    public static PlayNumb() {
        return MusicManager.MusicList[1].Play()
    }
}

export class Music {
    public name: string
    public Path: string

    public constructor(name: string, path: string) {
        this.name = name
        this.Path = path
    }

    public Play() {
        StopMusic(false)
        ClearMapMusic()
        if (this.name === 'All Music Stop') return
        PlayMusic(this.Path)
    }
}
