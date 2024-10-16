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
            new Music("Linkin Park - Numb", "Music\\LP-Numb.mp3"),
            new Music("Linkin Park - In The End", "Music\\LP-InTheEnd.mp3"),
            new Music("Linkin Park - Faint", "Music\\LP-Faint.mp3"),
            new Music("Skillet - Whispers in Dark", "Music\\Skillet-WhispersInDark.mp3"),
            new Music("Sum 41 - The Hell Song", "Music\\Sum41-HellSong.mp3"),
            new Music("DJ Sammy - Heaven", "Music\\DJSammy-Heaven.mp3"),
            new Music("Cascada - Everytime We Touch", "Music\\Cascada-Touch.mp3"),
            new Music("Cascada - Everytime We Touch(Fast)", "Music\\Cascada-Touch(fast).mp3")
        };
    }

    public static void CreateMusicList()
    {
        foreach(var musicItem in MusicList)
        {
            musicItem.SoundCreate();
            musicItem.SetAttributes();
        }
    }
}

public class Music
{
    private static int Count = 1;
    public string Name { get; }
    public string Path { get; }
    public sound Sound { get; set; }
    private button Button { get; set; }

    public Music(string name, string path)
    {
        Name = name;
        Path = path;
    }

    private void CreatingSound()
    {
        Utility.SimpleTimer(Count * 0.08f, SoundCreate);
        Count += 1;
    }

    public void SoundCreate()
    {
        Sound = sound.CreateFromFile(Path, true, true, false, 10, 10, "");
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

    public void SetAttributes()
    {
        Sound.SetChannel(0);
        Sound.SetVolume(127);
        Sound.SetPitch(1.0f);
        Sound.SetPosition(0, 0, 0);
        Sound.SetDistances(0, 50000);
        Sound.SetDistanceCutoff(200000f);
    }
}