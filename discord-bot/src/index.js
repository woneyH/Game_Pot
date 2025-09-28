// 1. 주요 클래스 가져오기
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

// ✅ 1.1 개선 적용: REST 클라이언트를 최상단에서 초기화
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ✅ 1.2 개선 적용: 채널 삭제 타이머 및 임시 채널 ID를 저장할 Map과 Set
const activeChannels = new Map();
const ephemeralChannels = new Set(); // 봇이 생성한 임시 채널 ID를 명시적으로 저장

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ✅ 슬래시 명령어 등록
const commands = [
    new SlashCommandBuilder()
        .setName('party')
        .setDescription('특정 멤버만 입장할 수 있는 임시 음성채널을 생성합니다')
        .addStringOption(option =>
            option.setName('members')
                .setDescription('채널에 초대할 멤버들을 멘션해주세요. (생략 가능)')
                .setRequired(false))
].map(command => command.toJSON());

// ---

// ✅ 봇이 준비되면 명령어 등록
client.once('ready', async () => {
    console.log(`✅ 로그인됨: ${client.user.tag}`);

    // const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN); // ❌ 1.1 개선: 제거됨
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ 슬래시 명령어 등록 완료');
    } catch (error) {
        console.error('⚠️ 슬래시 명령어 등록 중 오류 발생:', error);
    }
});

// ---

// ✅ 명령어 실행 시 동작
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'party') {
        const guild = interaction.guild;
        const memberMentions = interaction.options.getString('members');

        // ✅ 1.4 개선 적용: 멤버 멘션 파싱 로직 간소화
        let memberIds = [];
        if (memberMentions) {
            // 정규식 대신 문자열 조작으로 ID만 추출
            memberIds = memberMentions
                .split(' ')
                .map(mention => 
                    mention.replaceAll('<@', '')
                           .replaceAll('>', '')
                           .replaceAll('!', '')
                           .trim()
                )
                .filter(id => id.length > 10 && !isNaN(id)); // 유효한 ID인지 확인
        }

        // 명령어를 실행한 사용자(파티장)는 항상 포함
        if (!memberIds.includes(interaction.user.id)) {
            memberIds.push(interaction.user.id);
        }

        try {
            const members = (await Promise.all(
                memberIds.map(id => guild.members.fetch(id).catch(() => null))
            )).filter(m => m);
    
            if (members.length === 0) {
                return await interaction.reply({ content: '⚠️ 채널을 만들 유효한 멤버가 없습니다.', flags: 1 << 6});
            }

            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.Connect]
                },
                // ❌ 1.3 개선: 봇에게 ManageChannels 권한을 명시적으로 주는 코드는 제거 (서버 설정에 의존)
                ...members.map(member => ({
                    id: member.user.id,
                    allow: [PermissionFlagsBits.Connect]
                }))
            ];

            // ✅ 채널 이름에 무작위 난수 번호 추가
            const randomNumber = Math.floor(Math.random() * 9000) + 1000;
            const baseName = members.length === 1 ? '솔로 파티 음성채널' : `${members.length}인 파티 음성채널`;
            const channelName = `🎉 ${baseName} (${randomNumber})`;

            const channel = await guild.channels.create({
                name: channelName,
                type: 2,
                permissionOverwrites
            });

            // ✅ 1.2 개선 적용: 봇이 만든 임시 채널 ID를 Set에 저장
            ephemeralChannels.add(channel.id);

            await interaction.reply({
                content: `✅ 임시 음성채널 생성됨: ${channel}`,
                ephemeral: false
            });

        } catch (err) {
            console.error(err);
            await interaction.reply({
                content: '⚠️ 채널 생성 중 오류가 발생했습니다. 봇에 권한이 있는지 확인해주세요.',
                flags: 1 << 6
            });
        }
    }
});

// ---

// ✅ 음성 채널 상태 변경 감지 이벤트
client.on('voiceStateUpdate', (oldState, newState) => {
    // 1. 채널 퇴장 시 (채널이 비었는지 확인)
    if (oldState.channelId && !newState.channelId) {
        const channel = oldState.channel;
        
        // ✅ 1.2 개선 적용: 채널 이름 대신 ID를 확인하여 봇이 만든 채널인지 판단
        if (ephemeralChannels.has(channel.id)) {
            if (channel.members.size === 0) {
                if (!activeChannels.has(channel.id)) {
                    console.log(`✅ ${channel.name} 채널이 비었습니다. 1분 후 삭제됩니다.`);
                    const timer = setTimeout(() => {
                        if (channel.members.size === 0) {
                            channel.delete()
                                .then(deletedChannel => {
                                    console.log(`✅ 비어있는 임시 채널 '${deletedChannel.name}' 삭제 완료`);
                                    ephemeralChannels.delete(deletedChannel.id); // Set에서도 제거
                                })
                                .catch(err => console.error(`⚠️ 채널 삭제 중 오류 발생: ${err}`));
                        }
                        activeChannels.delete(channel.id);
                    }, 60000);
                    activeChannels.set(channel.id, timer);
                }
            }
        }
    }

    // 2. 채널 입장 시 (삭제 타이머 취소)
    if (!oldState.channelId && newState.channelId) {
        const channel = newState.channel;
        if (activeChannels.has(channel.id)) {
            clearTimeout(activeChannels.get(channel.id));
            activeChannels.delete(channel.id);
            console.log(`✅ ${channel.name} 채널에 멤버가 들어와 삭제 타이머를 취소합니다.`);
        }
    }
});

// ---

// ✅ 봇 로그인
client.login(process.env.BOT_TOKEN);

// 1. 필요한 Express 모듈 가져오기
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Render가 할당하는 포트 또는 기본값 3000 사용

// 2. 간단한 GET 엔드포인트 설정
app.get('/', (req, res) => {
    // Ping 요청이 오면 단순히 "OK"를 응답합니다.
    res.status(200).send('Bot is running and responding to pings.');
});

// 3. 웹 서버 리스닝 시작
app.listen(port, () => {
    console.log(`✅ 웹 서버가 포트 ${port}에서 구동 중입니다.`);
});
