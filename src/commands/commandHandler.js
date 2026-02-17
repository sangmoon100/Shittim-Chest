const { getRandomStudent } = require('../services/randomStudent');
const { registerChannel } = require('../services/channelService');
const { getCollection } = require('../utils/mongoConnection');

// 명령어 데이터를 메모리에 캐싱
let commandsData = [];

async function loadCommandsData() {
    try {
        const commandsCollection = await getCollection('commands');
        commandsData = await commandsCollection.find({}).toArray();
        console.log(`📋 MongoDB에서 ${commandsData.length}개의 명령어를 로드했습니다.`);
    } catch (error) {
        console.error('❌ 명령어 데이터 로드 실패:', error);
        commandsData = [];
    }
}

async function commandHandler(interaction) {
    // 명령어 데이터가 비어있으면 로드
    if (commandsData.length === 0) {
        await loadCommandsData();
    }

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

module.exports = { commandHandler, loadCommandsData };