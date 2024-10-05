using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class MusicManager
{
    public static List<Music> MusicList { get; private set; }
    public static void Initialize()
    {
        MusicList = RegisterMusicList();
    }

    public static void StopAllMusic()
    {
        foreach (var music in MusicList)
        {
            music.Stop();
        }
    }

    private static List<Music> RegisterMusicList()
    {
        return new List<Music>
        {
            new Music("Stop All Music", ""),
            new Music("Linkin Park - Numb", "war3mapImported\\LP-Numb.mp3"),
            new Music("Linkin Park - In The End", "war3mapImported\\LP_InTheEnd.mp3"),
            new Music("Linkin Park - Faint", "war3mapImported\\LP-Faint.mp3"),
            new Music("Skillet - Whispers in Dark", "war3mapImported\\Skillet-WhispersInDark.mp3"),
            new Music("Sum 41 - The Hell Song", "war3mapImported\\Sum41-HellSong.mp3"),
            new Music("DJ Sammy - Heaven", "war3mapImported\\DJSammy-Heaven.mp3"),
            new Music("Invulnerable", "war3mapImported\\Invulnerable.mp3")
        };
    }
}

public class Music
{
    public string Name { get; }
    public string Path { get; }
    public sound Sound { get; }
    private button Button { get; set; }

    public Music(string name, string path)
    {
        Name = name;
        Path = path;
        Sound = CreateSound(Path, true, true, false, 10, 10, "");
        Attributes();
    }

    public void Play()
    {
        if(Name == "Stop Music")
        {
            MusicManager.StopAllMusic();
            return;
        }
        Sound.Start();
    }
    public void Stop() => Sound.Stop(false, false);

    private void Attributes()
    {
        Sound.SetChannel(0);
        Sound.SetVolume(127);
        Sound.SetPitch(1.0f);
        Sound.SetPosition(0, 0, 0);
        Sound.SetDistanceCutoff(200000f);
    }
}