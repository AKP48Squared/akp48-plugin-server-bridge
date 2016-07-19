This plugin allows AKP48 to bridge two channels to each other.

# Installation

Step 1: `git clone` this repo into your AKP48Squared plugins directory (See the AKP48Squared documentation for more details).
Step 2: Restart or reload the bot.

# Commands

`addBridge`: Adds (or updates) a custom command.  
Usage: `addBridge <channel> [server]`  
Example: `addBridge #test b4a2ea76-9609-4c44-b9e8-926369639c80`  
Required Permissions: `['AKP48.owner']`

`rmBridge`: Removes a custom command.  
Usage: `rmBridge <channel> [server]`  
Example: `rmBridge #test b4a2ea76-9609-4c44-b9e8-926369639c80`  
Required Permissions: `['AKP48.owner', 'AKP48.op', 'irc.channel.owner', 'irc.channel.op', 'irc.channel.halfop']`

# Config

server-bridge stores all of its configuration in the plugins section of the main config.json file for AKP48.

# Issues

If you come across any issues, you can report them on this GitHub repo [here](https://github.com/AKP48Squared/akp48-plugin-server-bridge/issues).
