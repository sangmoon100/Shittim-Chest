require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadAllSchoolsDataFromMongo } = require('./src/utils/loadAllSchoolsData');
const { closeMongo } = require('./src/utils/mongoConnection');
// JSON 파일 불러오기
const commandsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'commands.json'), 'utf8')
);

const rest = new REST().setToken(process.env.TOKEN_DEV);

(async () => {
  let exitCode = 0;
  try {
    const studentsData = await loadAllSchoolsDataFromMongo();

    const schools = studentsData.map(school => ({
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

    console.log('명령어 등록 중...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID_DEV),
      { body: commands },
    );
    console.log('명령어 등록 완료!');
  } catch (error) {
    console.error(error);
    exitCode = 1;
  } finally {
    await closeMongo();
    if (typeof rest.destroy === 'function') {
      await rest.destroy();
    }
  }
  process.exitCode = exitCode;
})();