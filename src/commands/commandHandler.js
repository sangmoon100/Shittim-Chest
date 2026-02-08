const fs = require('fs');
const { getRandomStudent } = require('../services/randomStudent');
const { registerChannel } = require('../services/channelService');

// JSON 파일 불러오기
const commandsData = JSON.parse(fs.readFileSync('data/commands.json', 'utf8'));

async function commandHandler(interaction) {
    const cmd = commandsData.find(c => c.name === interaction.commandName);
    if (cmd && cmd.reply) {
        await interaction.reply(cmd.reply);
    }
    if (cmd && cmd.name === "샬레당번추첨") {
        await getRandomStudent(interaction);
    }
    if (cmd && cmd.name === "알람등록") {
        await registerChannel(interaction);
    }
}

module.exports = { commandHandler };