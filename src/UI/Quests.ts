import { Colors } from 'src/Utility/Colors/Colors'
import { Quest } from 'w3ts'

export class Quests {
    private static CommandsQuest: Quest
    private static ContributorsQuest: Quest
    private static LeaderboardsQuest: Quest
    private static HowToPlay: Quest

    public static Initialize = () => {
        Quests.CommandsQuest = Quest.create()!
        Quests.ContributorsQuest = Quest.create()!
        Quests.LeaderboardsQuest = Quest.create()!
        Quests.HowToPlay = Quest.create()!

        Quests.CreateHowToPlayQuest()
        Quests.CreateCommandsQuest()
        Quests.CreateContributorsQuest()
        Quests.WebsiteQuest()
    }

    private static CreateCommandsQuest = () => {
        Quests.CommandsQuest.setTitle('Commands')
        Quests.CommandsQuest.setIcon('war3mapImported\\BTNArcaniteNightRing.blp')
        Quests.CommandsQuest.required = false

        const description =
            'Commands can be retrieved with -help, they have a filter so you can type -help <command> to get more information about a specific command.\n\n'
        Quests.CommandsQuest.setDescription(`${Colors.COLOR_YELLOW}${description}|r`)
    }

    private static CreateContributorsQuest = () => {
        Quests.ContributorsQuest.setTitle('Contributors')
        Quests.ContributorsQuest.setIcon('ReplaceableTextures\\CommandButtons\\BTNHeartOff.blp')
        Quests.ContributorsQuest.setDescription(
            `${Colors.COLOR_YELLOW}Special thank you to each of the previous developers and clans such as F0LK, WaR, RD, and many more for their inspiration for Quests map.|r\n\n` +
                `${Colors.COLOR_YELLOW}Also a huge thank you to all of the previous developers of those versions, you've made a great difference.|r\n\n` +
                `${Colors.COLOR_YELLOW}Contributors: |r${Colors.COLOR_GREEN}Aches, Leyenda, Geek. Stan, Yoshimaru|r\n\n` +
                `${Colors.COLOR_YELLOW}Several assets within the map are from Hiveworkshop, if your asset is within Quests map; Thank you! If you'd like to be specially named, please let me know!|r\n\n` +
                `${Colors.COLOR_YELLOW}Huge thank you to both Stan & Maxiglider for use of their magical slide code!|r`
        )
    }

    private static WebsiteQuest = () => {
        Quests.LeaderboardsQuest.setTitle('Leaderboards')
        Quests.LeaderboardsQuest.setIcon('war3mapImported\\DiscordIcon.dds')
        Quests.LeaderboardsQuest.required = false
        Quests.LeaderboardsQuest.setDescription(
            `${Colors.COLOR_YELLOW}The leaderboards are a way to show off your skills and accomplishments. You can view the leaderboards at|r ${Colors.COLOR_LAVENDER}https://rkr-w3.vercel.app/leaderboard.|r\n\n` +
                `${Colors.COLOR_YELLOW}If you'd like to upload your stats, join our Discord and use the #uploadstats channel.|r\n\n` +
                `${Colors.COLOR_LAVENDER}https://discord.gg/GSu6zkNvx5|r`
        )
    }

    private static CreateHowToPlayQuest = () => {
        Quests.HowToPlay.setTitle('How to Play')
        Quests.HowToPlay.setIcon('ReplaceableTextures\\CommandButtons\\BTNTome.blp')
        Quests.HowToPlay.setDescription(
            `${Colors.COLOR_YELLOW}Run Kitty Run is a fast-paced, cooperative escape. Players must navigate through the safezones while dodging wolves.${Colors.COLOR_RESET}` +
                `\n\n${Colors.COLOR_YELLOW}Quests game has 5 rounds, each getting harder as the game goes on. Teamwork and quick reflexes are the key to success.${Colors.COLOR_RESET}` +
                `\n\n${Colors.COLOR_YELLOW}Once players hit level 10, they should acquire a relic from the shop ${Colors.COLOR_RESET}${Colors.COLOR_LAVENDER}(Hotkey: =).${Colors.COLOR_RESET}${Colors.COLOR_YELLOW} Good luck and have fun!${Colors.COLOR_RESET}`
        )
    }
}
