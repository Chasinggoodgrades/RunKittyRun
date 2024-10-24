using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class DiscordFrame
{
    private static framehandle EditBox;
    public static void Initialize()
    {
        Console.WriteLine("Created Textframe");
        BlzLoadTOCFile("war3mapImported\\templates.toc");
        EditBox = framehandle.Create("EscMenuEditBoxTemplate", originframetype.GameUI.GetOriginFrame(0), 0, 0);
        EditBox.SetAbsPoint(framepointtype.Center, 0.4f, 0.2f);
        EditBox.SetSize(0.2f, 0.03f);
    }

}