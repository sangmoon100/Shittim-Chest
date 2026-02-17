require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { loadAllSchoolsDataFromMongo } = require('./src/utils/loadAllSchoolsData');
const { closeMongo, getCollection } = require('./src/utils/mongoConnection');

const rest = new REST().setToken(process.env.TOKEN_DEV);

(async () => {
  let exitCode = 0;
  try {
    // MongoDB에서 명령어 데이터 불러오기
    const commandsCollection = await getCollection('commands');
    const commandsData = await commandsCollection.find({}).toArray();
    console.log(`📋 MongoDB에서 ${commandsData.length}개의 명령어를 불러왔습니다.`);

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