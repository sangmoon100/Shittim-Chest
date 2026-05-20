require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const cron = require('node-cron');
const { init, allSchoolsData } = require('./src/utils/init');
const { checkBirthdays } = require('./src/services/scheduler');
const { commandHandler, loadCommandsData } = require('./src/commands/commandHandler');
const { generateCalendarImage, createCalendarButtons } = require('./src/services/calender');

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
        await loadCommandsData();
        console.log(`봇 로그인 완료: ${client.user.tag}`);
    } catch (e) {
        console.error('초기화 중 오류 발생:', e);
    } finally {
        // 매일 아침 7시에 생일 체크 - 출근 시간대
        cron.schedule('0 7 * * *', () => {
            checkBirthdays(client);
        },{ timezone: "Asia/Seoul" }); // 호스팅 서버 환경 시계가 한국 시간과 다를 수 있어 Asia/Seoul 타임존 명시
    }

});

client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        await commandHandler(interaction);
        return;
    }

    // Handle button interactions
    if (interaction.isButton()) {
        // Calendar navigation buttons
        if (interaction.customId.startsWith('cal_')) {
            await handleCalendarButton(interaction);
        }
    }
});

async function handleCalendarButton(interaction) {
    try {
        // Parse customId: cal_prev_2026_3 or cal_next_2026_3
        const parts = interaction.customId.split('_');
        const year = parseInt(parts[2]);
        const month = parseInt(parts[3]);

        // Defer update as image generation may take time
        await interaction.deferUpdate();

        // Generate new calendar image
        const imageBuffer = await generateCalendarImage(year, month);
        const attachment = new AttachmentBuilder(imageBuffer, { name: `calendar_${year}_${month}.png` });

        // Create new navigation buttons with updated year/month
        const buttons = createCalendarButtons(year, month);

        // Update the message with new image and buttons
        await interaction.editReply({
            content: `📅 **${year}년 ${month}월 캘린더**`,
            files: [attachment],
            components: [buttons]
        });
    } catch (error) {
        console.error('캘린더 버튼 처리 중 오류:', error);
        await interaction.editReply({
            content: '❌ 캘린더 업데이트 중 오류가 발생했습니다.',
            components: []
        });
    }
}

client.login(process.env.TOKEN_DEV);