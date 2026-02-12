require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { init, allSchoolsData } = require('./src/utils/init');
const { checkBirthdays } = require('./src/services/scheduler');
const { commandHandler } = require('./src/commands/commandHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 봇 준비 완료 이벤트
client.once('ready', async () => {
    try {
        await init();
        console.log(`봇 로그인 완료: ${client.user.tag}`);
    } catch (e) {
        console.error('초기화 중 오류 발생:', e);
    } finally {
        // 매일 자정에 생일 체크
        cron.schedule('0 0 * * *', () => {
            checkBirthdays(client, allSchoolsData);
        },{ timezone: "Asia/Seoul" });
    }

});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    await commandHandler(interaction);
});

client.login(process.env.TOKEN_DEV);