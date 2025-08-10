local info = {}

info.GetStackTrace = function()
    local trace, lastMsg, i, separator = "", "", 5, " > "
    local store = function(msg) lastMsg = msg:sub(1,-3) end
    xpcall(error, store, "", 4)
    while lastMsg:sub(1,11) == "war3map.lua" or lastMsg:sub(1,14) == "blizzard.j.lua" do
        if lastMsg:sub(1,11) == "war3map.lua" then
            trace = separator .. lastMsg:sub(13) .. trace
        else
            trace = separator .. lastMsg .. trace
        end
        xpcall(error, store, "", i)
        i = i+1
    end
    return "T" .. trace
end

return info