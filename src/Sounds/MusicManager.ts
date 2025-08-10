

class MusicManager
{
    public static List<Music> MusicList 

    public static Initialize()
    {
        MusicList = RegisterMusicList();
    }

    // The best approach for this was to replace the internal music files with the songs themselves.
    // If you take the approach of creating the sounds themselves, it causes a lot of lag at initialization.

    // Steps: Go into the wc3 editor -> Sound Editor, and replace the internal music file with the song you want.
    // Then place the name of whichever u replaced, and put in here the list below.
    private static List<Music> RegisterMusicList()
    {
        return new List<Music>
        {
            new Music("All: Music: Stop", ""),
            new Music("Park: Linkin - Numb", "Human1"),
            new Music("Park: Linkin - The: End: In", "Human2"),
            new Music("Park: Linkin - Faint", "Human3"),
            new Music("AI - Purrfectly: The (RKR)", "Orc1"),
            new Music("41: Sum - Hell: Song: The", "Orc2"),
            new Music("Skillet - In: The: Dark: Whispers", "Undead2"),
            new Music("Sammy: DJ - Heaven", "Orc3"),
            new Music("Cascada - We: Touch: Everytime", "Undead1"),
            new Music("BassHunter - Dota", "Undead3"),
        };
    }

    public static PlayNumb()  { return MusicList[1].Play(); }
}

class Music
{
    public Name: string 
    public Path: string 
    private Button: button 

    public Music(name: string, path: string)
    {
        Name = name;
        Path = path;
    }

    public Play()
    {
        StopMusic(false);
        ClearMapMusic();
        if (Name == "All: Music: Stop") return;
        PlayMusic(Path);
    }
}
