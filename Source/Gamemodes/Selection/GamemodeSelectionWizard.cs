using WCSharp.Api;

/// <summary>
/// Shows dialog options to a player to select a gamemode, and calls <see cref="Gamemode.SetGameMode"/> with the chosen options.
/// Flow:
///   Main menu -> Standard            -> done
///             -> Solo Tournament     -> mode -> region             -> done
///             -> Team Tournament     -> mode -> team size -> auto-revive -> region -> done
/// </summary>
public static class GamemodeSelectionWizard
{
    private static SelectionDialog activeDialog;

    public static void Begin(player host)
    {
        ShowMainMenu(host, new GamemodeSelectionContext());
    }

    /// <summary>
    /// Hides and releases whichever dialog is currently open, without firing
    /// its callback. Called from <see cref="Gamemode.SetGameMode"/> so a
    /// gamemode chosen some other way (e.g. a VIP falling back to chat
    /// commands) doesn't leave a stale dialog on the host's screen.
    /// </summary>
    public static void CancelActive()
    {
        activeDialog?.Cancel();
        activeDialog = null;
    }

    private static void Display(player host, SelectionDialog dialog)
    {
        activeDialog?.Cancel();
        activeDialog = dialog;
        dialog.ShowTo(host);
    }

    private static void ShowMainMenu(player host, GamemodeSelectionContext context)
    {
        var dialog = new SelectionDialog(Colors.COLOR_GOLD + "Please choose a gamemode." + Colors.COLOR_RESET)
            .AddOption($"{Colors.COLOR_YELLOW_ORANGE}Standard{Colors.COLOR_RESET}", () =>
            {
                context.Mode = GameMode.Standard;
                Finish(context);
            })
            .AddOption($"{Colors.COLOR_YELLOW_ORANGE}Solo Tournament{Colors.COLOR_RESET}", () =>
            {
                context.Mode = GameMode.Solo;
                ShowSoloTypeMenu(host, context);
            })
            .AddOption($"{Colors.COLOR_YELLOW_ORANGE}Team Tournament{Colors.COLOR_RESET}", () =>
            {
                context.Mode = GameMode.Team;
                ShowTeamTypeMenu(host, context);
            });

        Display(host, dialog);
    }

    private static void ShowSoloTypeMenu(player host, GamemodeSelectionContext context)
    {
        var dialog = new SelectionDialog(Colors.COLOR_GOLD + "Solo Tournament - choose a mode." + Colors.COLOR_RESET)
            .AddOption($"{Colors.COLOR_YELLOW}Progression{Colors.COLOR_RESET}", () =>
            {
                context.ModeType = Globals.SOLO_MODES[0];
                ShowRegionMenu(host, context);
            })
            .AddOption($"{Colors.COLOR_YELLOW}Race{Colors.COLOR_RESET}", () =>
            {
                context.ModeType = Globals.SOLO_MODES[1];
                ShowRegionMenu(host, context);
            });

        Display(host, dialog);
    }

    private static void ShowTeamTypeMenu(player host, GamemodeSelectionContext context)
    {
        var dialog = new SelectionDialog(Colors.COLOR_GOLD + "Team Tournament - choose a mode." + Colors.COLOR_RESET)
            .AddOption($"{Colors.COLOR_YELLOW}Free Pick{Colors.COLOR_RESET}", () =>
            {
                context.ModeType = Globals.TEAM_MODES[0];
                ShowTeamSizeMenu(host, context);
            })
            .AddOption($"{Colors.COLOR_YELLOW}Random{Colors.COLOR_RESET}", () =>
            {
                context.ModeType = Globals.TEAM_MODES[1];
                ShowTeamSizeMenu(host, context);
            });

        Display(host, dialog);
    }

    private static void ShowTeamSizeMenu(player host, GamemodeSelectionContext context)
    {
        var dialog = new SelectionDialog(Colors.COLOR_GOLD + "Choose a team size." + Colors.COLOR_RESET);

        for (var size = 1; size <= Globals.MAX_TEAM_SIZE; size++)
        {
            var chosenSize = size; // capture by value, not the shared loop variable
            dialog.AddOption(chosenSize.ToString(), () =>
            {
                context.TeamSize = chosenSize;
                ShowAutoReviveMenu(host, context);
            });
        }

        Display(host, dialog);
    }

    private static void ShowAutoReviveMenu(player host, GamemodeSelectionContext context)
    {
        var dialog = new SelectionDialog(Colors.COLOR_GOLD + "Enable auto-revive?" + Colors.COLOR_RESET)
            .AddOption($"{Colors.COLOR_YELLOW}On{Colors.COLOR_RESET}", () =>
            {
                context.AutoRevive = true;
                ShowRegionMenu(host, context);
            })
            .AddOption($"{Colors.COLOR_YELLOW}Off{Colors.COLOR_RESET}", () =>
            {
                context.AutoRevive = false;
                ShowRegionMenu(host, context);
            });

        Display(host, dialog);
    }

    private static void ShowRegionMenu(player host, GamemodeSelectionContext context)
    {
        var dialog = new SelectionDialog(Colors.COLOR_GOLD + "Choose a region." + Colors.COLOR_RESET)
            .AddOption($"{Colors.COLOR_YELLOW}NA{Colors.COLOR_RESET}", () =>
            {
                context.Region = "NA";
                Finish(context);
            })
            .AddOption($"{Colors.COLOR_YELLOW}EU{Colors.COLOR_RESET}", () =>
            {
                context.Region = "EU";
                Finish(context);
            });

        Display(host, dialog);
    }

    private static void Finish(GamemodeSelectionContext context)
    {
        activeDialog = null;

        if (context.Mode == GameMode.Team)
        {
            Gamemode.SetAutoRevive(context.AutoRevive);
        }

        if (context.Region != null)
        {
            TournamentSaver.Instance.SetRegion(context.Region);
        }

        Gamemode.SetGameMode(context.Mode, context.ModeType, context.TeamSize);
    }
}
