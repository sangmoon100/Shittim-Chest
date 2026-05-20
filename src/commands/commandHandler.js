const { getRandomStudent } = require('../services/randomStudent');
const { registerChannel } = require('../services/channelService');
const { generateCalendarImage, createCalendarButtons } = require('../services/calender');
const { getCollection } = require('../utils/mongoConnection');
const { AttachmentBuilder } = require('discord.js');

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
    if (cmd && cmd.name === "캘린더") {
        await handleCalendarCommand(interaction);
    }
}

async function handleCalendarCommand(interaction) {
    try {
        // Defer reply as image generation may take time
        await interaction.deferReply();

        // Get year and month from options or use current Korea time
        const today = new Date();
        const koreaDate = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        
        const year = interaction.options.getInteger('년도') || koreaDate.getFullYear();
        const month = interaction.options.getInteger('월') || koreaDate.getMonth() + 1;

        // Generate calendar image
        const imageBuffer = await generateCalendarImage(year, month);
        const attachment = new AttachmentBuilder(imageBuffer, { name: `calendar_${year}_${month}.png` });

        // Create navigation buttons
        const buttons = createCalendarButtons(year, month);

        // Send calendar with buttons
        await interaction.editReply({
            content: `📅 **${year}년 ${month}월 캘린더**`,
            files: [attachment],
            components: [buttons]
        });
    } catch (error) {
        console.error('캘린더 생성 중 오류:', error);
        await interaction.editReply({
            content: '❌ 캘린더 생성 중 오류가 발생했습니다.',
            ephemeral: true
        });
    }
}

module.exports = { commandHandler, loadCommandsData };