require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const cron = require('node-cron');
const { checkBirthdays } = require('./src/scheduler');
const { randomStudent } = require('./src/randomStudent');
const { loadAllSchoolsData } = require('./src/loadAllSchoolsData');
const { openPort } = require('./src/webService');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
// JSON 파일 불러오기
const commandsData = JSON.parse(fs.readFileSync('./data/commands.json', 'utf8'));
const studentsData = loadAllSchoolsData(); 

// 봇 준비 완료 이벤트
client.once('ready', () => {
    openPort();
    console.log(`봇 로그인 완료: ${client.user.tag}`);
    // 매일 자정에 생일 체크
    cron.schedule('0 0 * * *', () => {
        checkBirthdays(client, studentsData);
    },{ timezone: "Asia/Seoul" });

});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = commandsData.find(c => c.name === interaction.commandName);
    if (cmd && cmd.reply) {
        await interaction.reply(cmd.reply);
    }
    if (cmd && cmd.name === "샬레당번추첨") {
        const schoolOption = interaction.options.getString('학교');
        if (schoolOption) {
            await interaction.reply(`당번 추첨 결과: ${randomStudent(studentsData, schoolOption)}`);
        } else { 
            await interaction.reply(`당번 추첨 결과: ${randomStudent(studentsData)}`);
        }
    }
    if (cmd && cmd.name === "알람등록") {
        const channel = interaction.options.getChannel('채널'); 
        const channelMap = JSON.parse(fs.readFileSync('./data/channels.json', 'utf8'));
        channelMap[interaction.guild.id] = channel.id;
        fs.writeFileSync('./data/channels.json', JSON.stringify(channelMap, null, 4));
        await interaction.reply(`알람 채널이 ${channel.name}으로 등록되었습니다.`);
    }
});

client.login(process.env.TOKEN);