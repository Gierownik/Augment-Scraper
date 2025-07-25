 require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, StringSelectMenuBuilder } = require('discord.js');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
String.prototype.tagCheck = function(char) {
    if (this.length >= 3 && this.charAt(2) === char) {
      return true;  
    }
    return false;  
  };

// Load data
const augments = JSON.parse(fs.readFileSync('UEparser/augments_dc.json', 'utf8'));
const weapons = JSON.parse(fs.readFileSync('UEparser/weapons_dc.json', 'utf8'));
const devices = JSON.parse(fs.readFileSync('UEparser/devices_dc.json', 'utf8'));
const shells = JSON.parse(fs.readFileSync('UEparser/shells_dc.json', 'utf8'));
const effects = JSON.parse(fs.readFileSync('effects.json', 'utf8'));
/**
 * Find the closest matching augment name using fuzzy matching
 * @param {string} query - The search query
 * @returns {string} - The closest matching augment name
 */
function findClosestAugment(query) {
    const augmentNames = Object.keys(augments);
    const matches = stringSimilarity.findBestMatch(query.toLowerCase(), augmentNames.map(name => name.toLowerCase()));
    return augmentNames[matches.bestMatchIndex];
}
function findClosestWeapon(query) {
    const weaponNames = Object.keys(weapons);
    const Gmatches = stringSimilarity.findBestMatch(query.toLowerCase(), weaponNames.map(name => name.toLowerCase()));
    return weaponNames[Gmatches.bestMatchIndex];
}
function findClosestDevice(query) {
    const deviceNames = Object.keys(devices);
    const Gmatches = stringSimilarity.findBestMatch(query.toLowerCase(), deviceNames.map(name => name.toLowerCase()));
    return deviceNames[Gmatches.bestMatchIndex];
}
function findClosestEffect(query) {
    const effectNames = Object.keys(effects);
    const Gmatches = stringSimilarity.findBestMatch(query.toLowerCase(), effectNames.map(name => name.toLowerCase()));
    return effectNames[Gmatches.bestMatchIndex];
}

/**
 * Create a Discord embed 
 * @param {string} augmentName 
 * @param {string[]} effects
 * @param {string} weaponName 
 * @param {string[]} stats 
 * @param {string} deviceName
 * @param {string[]} devstats
 * @param {string} shellName
 * @param {string[]} shellstats
 * @param {string} effectName
 * @param {string[]} effectstats
 * @returns {EmbedBuilder} - The Discord embed
 */
function createAugmentEmbed(augmentName, effects) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(augmentName)
        .setDescription('Effects:')
        .setTimestamp();

    // Split effects into positive and negative based on prefix
    const positiveEffects = effects.filter(effect => 
        effect.tagCheck('^')
    );
    const additionalEffects = effects.filter(effect => 
        effect.tagCheck('$')
    );
    const negativeEffects = effects.filter(effect => 
        effect.tagCheck('@')
    );
    const foundation = effects.filter(effect => 
        effect.startsWith('&')
    );

    const neutralEffects = effects.filter(effect => 
        !positiveEffects.includes(effect) && 
        !negativeEffects.includes(effect) &&
        !foundation.includes(effect)
    );
    
    const cleanEffect = line => line.tagCheck('^') || line.tagCheck('@') || line.tagCheck('$')
    ? line.slice(0, 2) + line.slice(3)
    : line.startsWith('&')
    ? line.slice(1)
    : line;
    

    // Add fields for different types of effects
    if (positiveEffects.length > 0) {
        embed.addFields({
            name: '✅ Positive Effects',
            value: positiveEffects.map(cleanEffect).join('\n')
        });
    }
    if (additionalEffects.length > 0) {
        embed.addFields({
            name: '🔧 Additional Mechanics',
            value: additionalEffects.map(cleanEffect).join('\n')
        });
    }
    if (negativeEffects.length > 0) {
        embed.addFields({
            name: '❌ Negative Effects',
            value: negativeEffects.map(cleanEffect).join('\n')
        });
    }

    if (neutralEffects.length > 0) {
        embed.addFields({
            name: '📝 Other Effects',
            value: neutralEffects.map(cleanEffect).join('\n')
        });
    }
    

    return embed;
}
function createGunEmbed(weaponName, stats) {
    const embed = new EmbedBuilder()
        .setColor('#db463b')
        .setTitle(weaponName)
        .setTimestamp();
        const Loadoutstats = stats.filter(stats => 
            stats.startsWith('^')
        );
        const Mainstats = stats.filter(stats => 
            stats.tagCheck('@')
        );
        const foundation = stats.filter(stats => 
            stats.startsWith('&')
        );
        const cleanStat = line => line.tagCheck('@')
        ? line.slice(0, 2) + line.slice(3)
        : line.startsWith('&') || line.startsWith('^')
        ? line.slice(1)
        : line;
        
        
        if (Loadoutstats.length > 0) {
            embed.addFields({
                name: '🧰  Loadout',
                value: Loadoutstats.map(cleanStat).join('\n')
            });
        }
        if (Mainstats.length > 0) {
            embed.addFields({
                name: '🔧 Stats',
                value: Mainstats.map(cleanStat).join('\n')
            });
        }
    return embed;
}
function createDeviceEmbed(deviceName, devstats) {
    const embed = new EmbedBuilder()
        .setColor('#03fc7f')
        .setTitle(deviceName)
        .setTimestamp();
        const positiveStats = devstats.filter(devstats => 
            devstats.tagCheck('^')
        );
        const baseStats = devstats.filter(devstats => 
            devstats.startsWith('$')
        );
        const negativeStats = devstats.filter(devstats => 
            devstats.tagCheck('@')
        );
        const foundation = devstats.filter(devstats => 
            devstats.startsWith('&')
        );
    
        const neutralStats = devstats.filter(devstats => 
            !positiveStats.includes(devstats) && 
            !negativeStats.includes(devstats) &&
            !foundation.includes(devstats) &&
            !baseStats.includes(devstats)
        );
        const cleanStats = line => line.tagCheck('^') || line.tagCheck('@')
        ? line.slice(0, 2) + line.slice(3)
        : line.startsWith('&') || line.startsWith('$')
        ? line.slice(1)
        : line;
        
    
        // Add fields for different types of effects
        if (baseStats.length > 0) {
            embed.addFields({
                name: '🔧 Base Stats',
                value: baseStats.map(cleanStats).join('\n')
            });
        }
        if (positiveStats.length > 0) {
            embed.addFields({
                name: '✅ Positive Stats',
                value: positiveStats.map(cleanStats).join('\n')
            });
        }
        if (negativeStats.length > 0) {
            embed.addFields({
                name: '❌ Negative Stats',
                value: negativeStats.map(cleanStats).join('\n')
            });
        }
    
        if (neutralStats.length > 0) {
            embed.addFields({
                name: '📝 Other Stats',
                value: neutralStats.map(cleanStats).join('\n')
            });
        }
    
        return embed;
}
function createShellEmbed(shellName, stats) {
    const embed = new EmbedBuilder()
        .setColor('#0affb6')
        .setTitle(shellName)
        .setTimestamp();

    const foundation = stats.filter(stat => stat.startsWith('&'));
    const mainStats = stats.filter(stat => 
        !stat.startsWith('&') && !stat.startsWith('**:: ') && !stat.startsWith('- ')
    );


    let currentAugment = null;
    const augmentsMap = {};

    for (const line of stats) {
        if (line.startsWith('**:: ')) {
            currentAugment = line;
            augmentsMap[currentAugment] = [];
        } else if (currentAugment && !line.startsWith('&') && line.startsWith('- ')) {
            augmentsMap[currentAugment].push(line);
        }
    }

    const cleanStat = line => line.tagCheck('@') || line.tagCheck('^')
        ? line.slice(0, 2) + line.slice(3)
        : line.startsWith('&')
        ? line.slice(1)
        : line;

    if (mainStats.length > 0) {
        embed.addFields({
            name: '🔧 Stats',
            value: mainStats.map(cleanStat).join('\n')
        });
    }

    for (const [title, entries] of Object.entries(augmentsMap)) {
        if (entries.length > 0) {
            embed.addFields({
                name: `🦾 ${title}`,
                value: entries.map(cleanStat).join('\n')
            });
        }
    }

    return embed;
}
function createEffectEmbed(effectName, effects) {
    const embed = new EmbedBuilder()
        .setColor('#4e6c85')
        .setTitle(effectName)
        .setTimestamp();

    // Split effects into positive and negative based on prefix
    const positiveEffects = effects.filter(effect => 
        effect.tagCheck('^')
    );
    const negativeEffects = effects.filter(effect => 
        effect.tagCheck('@')
    );
    const enhancement = effects.filter(effect => 
        effect.startsWith('&')
    );
    const enhancementEffects = effects.filter(effect => 
        effect.tagCheck('$')
    );
    
    const cleanEffect = line => line.tagCheck('^') || line.tagCheck('@') || line.tagCheck('$')
    ? line.slice(0, 2) + line.slice(3)
    : line.startsWith('&')
    ? line.slice(1)
    : line;
    

    // Add fields for different types of effects
    if (positiveEffects.length > 0) {
        embed.addFields({
            name: '✅ Positive Effects',
            value: positiveEffects.map(cleanEffect).join('\n')
        });
    }
    if (negativeEffects.length > 0) {
        embed.addFields({
            name: '❌ Negative Effects',
            value: negativeEffects.map(cleanEffect).join('\n')
        });
    }
    if (enhancementEffects.length > 0) {
        embed.addFields({
            name: `⏫ Enhancement: ${enhancement.map(cleanEffect)}`,
            value: enhancementEffects.map(cleanEffect).join('\n')
        });
    }
    return embed;
}

// Define the slash command
const augmentCommand = new SlashCommandBuilder()
    .setName('augment')
    .setDescription('Get information about an augment')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name of the augment')
            .setRequired(true));
const augallCommand = new SlashCommandBuilder()
    .setName('aug-all')
    .setDescription('Get information about all augments, split into pages')
    .addIntegerOption(option =>
        option.setName('page')
            .setDescription('Page number')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(7) );
const weaponCommand = new SlashCommandBuilder()          
    .setName('weapon')
    .setDescription('Get information about a weapon')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name of the weapon')
            .setRequired(true));
const deviceCommand = new SlashCommandBuilder()          
    .setName('device')
    .setDescription('Get information about a device')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name of the device')
            .setRequired(true));
const effectCommand = new SlashCommandBuilder()          
    .setName('effect')
    .setDescription('Get information about an effect')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name of the effect')
            .setRequired(true));
const shellCommand = new SlashCommandBuilder()
  .setName('shell')
  .setDescription('Get information about a shell')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Select a shell')
      .setRequired(true)
      .addChoices(
        { name: 'Bison', value: 'Bison' },
        { name: 'Hydra', value: 'Hydra' },
        { name: 'Dragon', value: 'Dragon' },
        { name: 'Ghost', value: 'Ghost' },
        { name: 'Rhino', value: 'Rhino' },
      )
  );

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [augmentCommand.toJSON(), augallCommand.toJSON(), weaponCommand.toJSON(), deviceCommand.toJSON(), shellCommand.toJSON(), effectCommand.toJSON()] },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'augment') {
        const query = interaction.options.getString('name');
        const closestMatch = findClosestAugment(query);
        const effects = augments[closestMatch];

        if (!effects) {
            await interaction.reply('No augment found matching your query.');
            return;
        }

        const embed = createAugmentEmbed(closestMatch, effects);
        await interaction.reply({ embeds: [embed] });
    }

    else if (interaction.commandName === 'aug-all') {
        const page = interaction.options.getInteger('page');
        const perPage = 10;
        const allAugments = Object.entries(augments)
        const start = (page - 1) * perPage;
        const pageItems = allAugments.slice(start, start + perPage);
        const embeds = pageItems.map(([name, effects]) =>
            createAugmentEmbed(name, effects)
        );
    
        await interaction.reply({ embeds });
    }
    else if (interaction.commandName === 'weapon') { 
        const queryGun = interaction.options.getString('name');
        const closestMatchGun = findClosestWeapon(queryGun);
        const stats = weapons[closestMatchGun];

        if (!stats) {
            await interaction.reply('No gun found matching your query.');
            return;
        }

        const embed = createGunEmbed(closestMatchGun, stats);
        await interaction.reply({ embeds: [embed] });
    }
    else if (interaction.commandName === 'device') { 
        const queryDev = interaction.options.getString('name');
        const closestMatchDev = findClosestDevice(queryDev);
        const devs = devices[closestMatchDev];

        if (!devs) {
            await interaction.reply('No device found matching your query.');
            return;
        }

        const embed = createDeviceEmbed(closestMatchDev, devs);
        await interaction.reply({ embeds: [embed] });
    }
    else if (interaction.commandName === 'effect') { 
        const queryEffect = interaction.options.getString('name');
        const closestMatchEffect = findClosestEffect(queryEffect);
        const effs = effects[closestMatchEffect];

        if (!effs) {
            await interaction.reply('No effect found matching your query.');
            return;
        }

        const embed = createEffectEmbed(closestMatchEffect, effs);
        await interaction.reply({ embeds: [embed] });
    }
    else if (interaction.commandName === 'shell') { 
        const shell = interaction.options.getString('name');
        const shellstat = shells[shell]

        if (!shell) {
            await interaction.reply('Select a Shell');
            return;
        }

        const embed = createShellEmbed(shell, shellstat);
        await interaction.reply({ embeds: [embed] });
    }
});

// Handle ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);