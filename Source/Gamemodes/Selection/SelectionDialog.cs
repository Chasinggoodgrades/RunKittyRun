using System;
using System.Collections.Generic;
using WCSharp.Api;

/// <summary>
/// Thin, reusable wrapper around WCSharp's dialog API. Builds a dialog with
/// a title and a set of labelled options, and invokes the matching option's
/// callback (passed the player who clicked) when a button is pressed.
///
/// Two lifetimes are supported via <paramref name="closeOnSelect"/>:
///  - Single-shot (default, closeOnSelect: true): shown to one player via
///    ShowTo(player); the whole dialog closes the instant they pick
///    anything. Used by GamemodeSelectionWizard.
///  - Broadcast (closeOnSelect: false): shown to many players at once via
///    ShowTo(IEnumerable&lt;player&gt;). Each click just hides the dialog for
///    that one player and reports their pick - everyone else keeps voting -
///    until the caller explicitly calls Cancel(). Used by Difficulty's vote.
/// </summary>
public sealed class SelectionDialog
{
    private readonly dialog handle;
    private readonly trigger clickTrigger;
    private readonly bool closeOnSelect;
    private readonly Dictionary<button, Action<player>> optionHandlers = new Dictionary<button, Action<player>>();
    private readonly List<player> visibleTo = new List<player>();

    private int nextHotkey;
    private bool isActive;

    public SelectionDialog(string title, bool closeOnSelect = true)
    {
        this.closeOnSelect = closeOnSelect;

        handle = dialog.Create();
        handle.SetMessage(title);

        clickTrigger = trigger.Create();
        clickTrigger.RegisterDialogEvent(handle);
        clickTrigger.AddAction(HandleClick);
    }

    /// <summary>Adds a button whose handler doesn't need to know who clicked.</summary>
    public SelectionDialog AddOption(string label, Action onSelected)
        => AddOption(label, _ => onSelected());

    /// <summary>Adds a button whose handler receives the player who clicked it.</summary>
    public SelectionDialog AddOption(string label, Action<player> onSelected)
    {
        var buttonHandle = handle.AddButton(label, nextHotkey++);
        optionHandlers[buttonHandle] = onSelected;
        return this;
    }

    public void ShowTo(player target)
    {
        isActive = true;
        visibleTo.Add(target);
        handle.SetVisibility(target, true);
    }

    public void ShowTo(IEnumerable<player> targets)
    {
        foreach (var target in targets)
        {
            ShowTo(target);
        }
    }

    /// <summary>
    /// Hides the dialog from everyone it's currently shown to, without
    /// invoking any option's callback. Safe to call more than once, or on a
    /// dialog that was never shown.
    /// </summary>
    public void Cancel()
    {
        if (!isActive) return;
        isActive = false;
        HideFromEveryone();
    }

    private void HandleClick()
    {
        if (!isActive) return;

        var clickedPlayer = @event.Player;
        var clickedButton = @event.ClickedButton;

        handle.SetVisibility(clickedPlayer, false);
        visibleTo.Remove(clickedPlayer);

        if (closeOnSelect)
        {
            isActive = false;
            HideFromEveryone();
        }

        if (optionHandlers.TryGetValue(clickedButton, out var onSelected))
        {
            onSelected(clickedPlayer);
        }
    }

    private void HideFromEveryone()
    {
        foreach (var target in visibleTo)
        {
            handle.SetVisibility(target, false);
        }
        visibleTo.Clear();
    }
}
