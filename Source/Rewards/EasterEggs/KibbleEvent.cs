using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class KibbleEvent
{
    private static bool EventActive = false;
    private static bool EventPlayed = false;
    private static int EventKibblesCollected = 0;
    private static int TotalEventKibbles = 50;
    private static timer EventTimer;
    private static timerdialog EventTimerDialog;
    private static List<Kibble> EventKibbles = new List<Kibble>();
    private const float EventLength = 300.0f; // 5 minutes

    public static void StartKibbleEvent(float chance)
    {
        var adjustedChance = Source.Program.Debug ? 70 : 0.05f;
        if (chance > adjustedChance || EventPlayed) return;

        EventActive = true;
        EventPlayed = true; // only once per game.
        EventKibblesCollected = 0;

        EventTimer = timer.Create();
        EventTimerDialog = timerdialog.Create(EventTimer);
        EventTimerDialog.SetTitle("Kibble Event");
        EventTimerDialog.IsDisplayed = true;
        EventTimer.Start(EventLength, false, EndKibbleEvent);

        // Spawn event kibbles
        for (int i = 0; i < TotalEventKibbles; i++)
        {
            var kibble = new Kibble();
            EventKibbles.Add(kibble);
        }

        UpdateEventProgress();
    }


    private static void EndKibbleEvent()
    {
        EventActive = false;
        GC.RemoveTimerDialog(ref EventTimerDialog);
        GC.RemoveTimer(ref EventTimer);
        for (int i = 0; i < EventKibbles.Count; i++)
        {
            EventKibbles[i].Dispose();
            EventKibbles[i] = null;
        }
        GC.RemoveList(ref EventKibbles);
        
        Utility.TimedTextToAllPlayers(10.0f, $"{Colors.COLOR_YELLOW}The kibble collecting event has ended! {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|r were collected.");
    }

    private static void UpdateEventProgress()
    {
        EventTimerDialog.SetTitle($"Kibble Collected: {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|r");
    }

    public static void CollectEventKibble()
    {
        if (!EventActive) return;

        EventKibblesCollected++;
        UpdateEventProgress();

        if (EventKibblesCollected >= TotalEventKibbles)
        {
            Challenges.DivineWindwalk();
            EndKibbleEvent();
        }
    }

    public static bool IsEventActive()
    {
        return EventActive;
    }
}
