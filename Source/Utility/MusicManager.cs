using System;
using System.Collections.Generic;
using System.Xml.Schema;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class MusicManager
{
    public static List<Music> MusicList { get; private set; }
    public static void Initialize() => MusicList = RegisterMusicList();

    // The best approach for this was to replace the internal music files with the songs themselves.
    // If you take the approach of creating the sounds themselves, it causes a lot of lag at initialization.

    // Steps: Go into the wc3 editor -> Sound Editor, and replace the internal music file with the song you want.
    // Then place the name of whichever u replaced, and put in here the list below.
    private static List<Music> RegisterMusicList()
    {
        return new List<Music>
        {
            new Music("Stop All Music", ""),
            new Music("Linkin Park - Numb", "Human1"),
            new Music("Linkin Park - In The End", "Human2"),
            new Music("Linkin Park - Faint", "Human3"),
            new Music("Skillet - Whispers in Dark", "Orc1"),
            new Music("Sum 41 - The Hell Song", "Orc2"),
            new Music("DJ Sammy - Heaven", "Orc3"),
            new Music("Cascada - Everytime We Touch", "Undead1"),
            new Music("Cascada - Everytime We Touch(Fast)", "Undead2")
        };
    }
}

public class Music
{
    public string Name { get; }
    public string Path { get; }
    private button Button { get; set; }

    public Music(string name, string path)
    {
        Name = name;
        Path = path;
    }

    public void Play()
    {
        StopMusic(false);
        if (Name == "Stop All Music") return;
        PlayMusic(Path);
    }
}