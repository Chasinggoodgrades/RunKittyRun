**__Run Kitty Run - Remastered v2.0.5 ASYNC__**
Error messages are now per player, and a few small fixes.

**__Error Messages__**
- `-error on` / `-error off` now only affects you instead of everyone.
- New players default to error messages off. Players with more than 10 games played get them on by default. Your `-error` choice always overrides the default.
- Error and warning messages now show up in-game as on-screen text instead of the chat console. This includes multiboard and player-leave errors.

**__Shop__**
- Shop button status now refreshes after you sell an item or relic.

**__Bug Fixes__**
- Fixed timers not being cleaned up properly, which could leak memory over a long game.
- Reward handling (wings, hats, auras, trails, skins, windwalks) was reworked. Applying and resetting cosmetics should behave the same as before.
