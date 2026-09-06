using WCSharp.Api;

public static class Quests
{
    private static quest CommandsQuest = quest.Create();
    private static quest ContributorsQuest = quest.Create();
    private static quest LeaderboardsQuest = quest.Create();
    private static quest HowToPlay = quest.Create();
    private static quest GamemodesQuest = quest.Create();
    private static quest TeamDeathlessQuest = quest.Create();
    private static quest ChainedTogetherQuest = quest.Create();

    public static void Initialize()
    {
        CreateHowToPlayQuest();
        CreateGamemodesQuest();
        CreateTeamDeathlessQuest();
        CreateChainedTogetherQuest();
        CreateCommandsQuest();
        CreateContributorsQuest();
        WebsiteQuest();
    }

    private static void CreateCommandsQuest()
    {
        CommandsQuest.SetTitle("Commands");
        CommandsQuest.SetIcon("war3mapImported\\BTNArcaniteNightRing.blp");
        CommandsQuest.IsRequired = false;

        string description = "Commands can be retrieved with -help, and they have a filter so you can type -help <command> to get more information about a specific command.\n\n";
        CommandsQuest.SetDescription($"{Colors.COLOR_YELLOW}{description}|r" +
            $"\n{Colors.COLOR_YELLOW}When getting too many items on your screen, you can press the ` key on your keyboard to clear the text on your screen.{Colors.COLOR_RESET}");
    }

    private static void CreateContributorsQuest() 
    {
        ContributorsQuest.SetTitle("Contributors");
        ContributorsQuest.SetIcon("ReplaceableTextures\\CommandButtons\\BTNHeartOff.blp");
        ContributorsQuest.SetDescription($"{Colors.COLOR_YELLOW}Special thank you to each of the previous developers and clans such as F0LK, WaR, RD, and many more for their inspiration for this map.|r\n\n" +
            $"{Colors.COLOR_YELLOW}Also a huge thank you to all of the previous developers of those versions, you've made a great difference.|r\n\n" +
            $"{Colors.COLOR_YELLOW}Contributors: |r{Colors.COLOR_GREEN}Aches, Leyenda, Geek. Stan, Yoshimaru|r\n\n" +
            $"{Colors.COLOR_YELLOW}Special thanks to Nooberman for the Garfield model.|r\n\n" +
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
            $"\n\n{Colors.COLOR_YELLOW}Once players hit level {Relic.RequiredLevel}, they should acquire a relic from the shop {Colors.COLOR_RESET}{Colors.COLOR_LAVENDER}(Hotkey: =).{Colors.COLOR_RESET}{Colors.COLOR_YELLOW} Good luck and have fun!{Colors.COLOR_RESET}");
    }

    private static void CreateGamemodesQuest()
    {
        GamemodesQuest.SetTitle("Gamemodes & Difficulties");
        GamemodesQuest.SetIcon("ReplaceableTextures\\CommandButtons\\BTNTome.blp");
        GamemodesQuest.IsRequired = true;
        GamemodesQuest.SetDescription(
            $"{Colors.COLOR_GOLD}GAMEMODES{Colors.COLOR_RESET}\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Standard:{Colors.COLOR_RESET} 5-round cooperative mode. Players work together to navigate safezones and avoid wolves.\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Teams:{Colors.COLOR_RESET} Competitive team-based mode. Teams race to complete rounds faster than opponents.\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Solo Tournament:{Colors.COLOR_RESET} Individual competitive mode. Each player competes for the best time.\n\n" +
            $"{Colors.COLOR_GOLD}DIFFICULTIES{Colors.COLOR_RESET}\n\n" +
            $"{Colors.COLOR_YELLOW}Normal:{Colors.COLOR_RESET} Standard wolf count. No affixes.\n\n" +
            $"{Colors.COLOR_RED}Hard:{Colors.COLOR_RESET} Increased wolf count. Some wolves have affixes.\n\n" +
            $"{Colors.COLOR_DARK_RED}Impossible:{Colors.COLOR_RESET} High wolf count. More affixed wolves per round.\n\n" +
            $"{Colors.COLOR_PURPLE}Nightmare:{Colors.COLOR_RESET} Maximum wolf count. Every wolf has an affix.\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Progressive:{Colors.COLOR_RESET} 3-round mode with escalating difficulty. Round 1 = Standard R3 Normal, Round 2 = Standard R4 Hard, Round 3 = Standard R5 Impossible.");
    }

    private static void CreateTeamDeathlessQuest()
    {
        TeamDeathlessQuest.SetTitle("Team Deathless");
        TeamDeathlessQuest.SetIcon("ReplaceableTextures\\CommandButtons\\BTNOrbOfFire.blp");
        TeamDeathlessQuest.IsRequired = false;
        TeamDeathlessQuest.SetDescription(
            $"{Colors.COLOR_YELLOW}Relay-style challenge requiring team coordination.{Colors.COLOR_RESET}\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Activation:{Colors.COLOR_RESET}\n" +
            $"• 4+ players must complete a round without dying\n" +
            $"• A fire orb spawns at the first safezone next round\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Objective:{Colors.COLOR_RESET}\n" +
            $"• Pass the orb from safezone to safezone\n" +
            $"• Walk near the orb to pick it up\n" +
            $"• Each player can carry it once per cycle\n" +
            $"• Cycle resets after all players have carried\n" +
            $"• 75% chance to restart if carrier dies\n" +
            $"• Deliver to final safezone to complete\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Rewards:{Colors.COLOR_RESET} Deathless auras - {Colors.COLOR_YELLOW}Normal{Colors.COLOR_RESET}, {Colors.COLOR_RED}Hard{Colors.COLOR_RESET}, {Colors.COLOR_DARK_RED}Impossible{Colors.COLOR_RESET} variants based on difficulty.");
    }

    private static void CreateChainedTogetherQuest()
    {
        ChainedTogetherQuest.SetTitle("Chained Together");
        ChainedTogetherQuest.SetIcon("ReplaceableTextures\\CommandButtons\\BTNAdvancedStrengthOfTheMoon.blp");
        ChainedTogetherQuest.IsRequired = false;
        ChainedTogetherQuest.SetDescription(
            $"{Colors.COLOR_YELLOW}Proximity-based challenge requiring constant coordination.{Colors.COLOR_RESET}\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Activation:{Colors.COLOR_RESET}\n" +
            $"• All players reach final safezone together\n" +
            $"• No safezone skipping allowed\n" +
            $"• Begins next round after activation\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Objective:{Colors.COLOR_RESET}\n" +
            $"• Maintain proximity to at least one other player\n" +
            $"• Lightning effects show active connections\n" +
            $"• Range requirement varies by difficulty\n" +
            $"• Complete the round while maintaining chains\n\n" +
            $"{Colors.COLOR_YELLOW_ORANGE}Rewards:{Colors.COLOR_RESET} Chained auras - {Colors.COLOR_YELLOW}Normal{Colors.COLOR_RESET}, {Colors.COLOR_RED}Hard{Colors.COLOR_RESET}, {Colors.COLOR_DARK_RED}Impossible{Colors.COLOR_RESET}, {Colors.COLOR_PURPLE}Nightmare{Colors.COLOR_RESET} variants.");
    }
}
