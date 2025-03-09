using System;
using WCSharp.Api;

public static class Quests
{
    private static quest CommandsQuest = quest.Create();
    private static quest ContributorsQuest = quest.Create();
    private static quest LeaderboardsQuest = quest.Create();
    private static quest HowToPlay = quest.Create();
    public static void Initialize()
    {
        CreateHowToPlayQuest();
        CreateCommandsQuest();
        CreateContributorsQuest();
        WebsiteQuest();
    }

    private static void CreateCommandsQuest()
    {
        var commands = GeneralCmds.DisplayCommands();
        CommandsQuest.SetTitle("Commands");
        CommandsQuest.SetIcon("war3mapImported\\BTNArcaniteNightRing.blp");
        CommandsQuest.IsRequired = false;

        var commandLines = commands.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
        string description = string.Join($"\n{Colors.COLOR_YELLOW}", commandLines);

        CommandsQuest.SetDescription($"{Colors.COLOR_YELLOW}{description}|r");
    }

    private static void CreateContributorsQuest()
    {
        ContributorsQuest.SetTitle("Contributors");
        ContributorsQuest.SetIcon("ReplaceableTextures\\CommandButtons\\BTNHeartOff.blp");
        ContributorsQuest.SetDescription($"{Colors.COLOR_YELLOW}Special thank you to each of the previous developers and clans such as F0LK, WaR, RD, and many more for their inspiration for this map.|r\n\n" +
            $"{Colors.COLOR_YELLOW}Also a huge thank you to all of the previous developers of those versions, you've made a great difference.|r\n\n" +
            $"{Colors.COLOR_YELLOW}Contributors: |r{Colors.COLOR_GREEN}Aches, Leyenda, Geek. Stan, Yoshimaru|r\n\n" +
            $"{Colors.COLOR_YELLOW}Several assets within the map are from Hiveworkshop, if your asset is within this map ; Thank you! If you'd like to be specially named, please let me know!|r\n\n" +
            $"{Colors.COLOR_YELLOW}Huge thank you to both Stan & Maxiglider for use of their magical slide code!|r");
    }

    private static void WebsiteQuest()
    {
        LeaderboardsQuest.SetTitle("Leaderboards");
        LeaderboardsQuest.SetIcon("war3mapImported\\DiscordIcon.dds");
        LeaderboardsQuest.IsRequired = false;
        LeaderboardsQuest.SetDescription($"{Colors.COLOR_YELLOW}The leaderboards are a way to show off your skills and accomplishments. You can view the leaderboards at|r {Colors.COLOR_LAVENDER}https://rkr-w3.vercel.app/leaderboard.|r\n\n" +
            $"{Colors.COLOR_YELLOW}If you'd like to upload your stats, join our Discord and use the #uploadstats channel.|r\n\n" +
            $"{Colors.COLOR_LAVENDER}https://discord.gg/GSu6zkNvx5|r");
    }

    private static void CreateHowToPlayQuest()
    {
        HowToPlay.SetTitle("How to Play");
        HowToPlay.SetIcon("ReplaceableTextures\\CommandButtons\\BTNTome.blp");
        HowToPlay.SetDescription($"{Colors.COLOR_YELLOW}Run Kitty Run is a fast-paced, cooperative escape. Players must navigate through the safezones while dodging wolves.{Colors.COLOR_RESET}" +
            $"\n\n{Colors.COLOR_YELLOW}This game has 5 rounds, each getting harder as the game goes on. Teamwork and quick reflexes are the key to success.{Colors.COLOR_RESET}" +
            $"\n\n{Colors.COLOR_YELLOW}Once players hit level 10, they should acquire a relic from the shop {Colors.COLOR_RESET}{Colors.COLOR_LAVENDER}(Hotkey: =).{Colors.COLOR_RESET}{Colors.COLOR_YELLOW} Good luck and have fun!{Colors.COLOR_RESET}");
    }



}
