require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { loadAllSchoolsData } = require('./src/utils/loadAllSchoolsData');
// JSON 파일 불러오기
const commandsData = JSON.parse(fs.readFileSync('./data/commands.json', 'utf8'));
const studentsData = loadAllSchoolsData();

const schools = studentsData.schools.map(school => ({
    name: school.school,
    value: school.school
}));
const schoolChoices = [...new Map(schools.map(school => [school.name, school])).values()];

const commands = commandsData.map(cmd => {
    if (cmd.reply) {
        return new SlashCommandBuilder()
          .setName(cmd.name)
          .setDescription(cmd.description)
          .toJSON()
    } else if (cmd.name === "샬레당번추첨") {
        return new SlashCommandBuilder()
          .setName(cmd.name)
          .setDescription(cmd.description)
          .addStringOption(option =>
              option.setName('학교')
                .setDescription('학교 선택')
                .setRequired(false)
                .addChoices(...schoolChoices)
          )
          .toJSON()
    } else if (cmd.name === "알람등록") {
        return new SlashCommandBuilder()
          .setName(cmd.name)
          .setDescription(cmd.description)
          .addChannelOption(option =>
              option.setName('채널')
                .setDescription('알람을 받을 채널을 선택하세요.')
                .setRequired(true)
          )
          .toJSON()
    }
});

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('명령어 등록 중...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('명령어 등록 완료!');
  } catch (error) {
    console.error(error);
  }
})();