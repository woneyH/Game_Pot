// 1. 주요 클래스 및 모듈 가져오기
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const express = require('express');
require('dotenv').config();

// ✅ REST 클라이언트를 최상단에서 초기화
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ✅ 채널 삭제 타이머 및 임시 채널 ID를 저장할 Map과 Set
const activeChannels = new Map();
const ephemeralChannels = new Set(); // 봇이 생성한 임시 채널 ID를 명시적으로 저장

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates // 음성 상태 변경 감지 필수
    ]
});

// --- Express 서버 설정 ---
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json()); // JSON 본문을 파싱할 수 있도록 설정

// 24시간 구동을 위한 Ping 엔드포인트
app.get('/', (req, res) => {
    res.status(200).send('Discord Bot is running and ready for pings.');
});

// ✅ 웹사이트 파티 생성 엔드포인트
const TARGET_GUILD_ID = '여기에_특정_Discord_서버_ID_입력'; // 👈 봇이 작동할 서버 ID를 넣어주세요!

app.post('/api/create-party', async (req, res) => {
    const { memberNames } = req.body; 

    if (!memberNames || !Array.isArray(memberNames) || memberNames.length === 0) {
        return res.status(400).send({ error: 'memberNames 배열이 비어있거나 올바르지 않습니다.' });
    }

    const guild = client.guilds.cache.get(TARGET_GUILD_ID); 
    if (!guild) {
        return res.status(500).send({ error: 'Target Discord Server not found or bot not invited.' });
    }

    try {
        // 닉네임을 유저 ID로 변환하는 핵심 검색 로직
        const memberIds = [];
        const notFoundNames = [];
        await guild.members.fetch(); 

        for (const name of memberNames) {
            const member = guild.members.cache.find(m => 
                m.displayName.toLowerCase() === name.toLowerCase() ||
                m.user.username.toLowerCase() === name.toLowerCase()
            );
            
            if (member) {
                memberIds.push(member.user.id);
            } else {
                notFoundNames.push(name);
            }
        }
        
        if (memberIds.length === 0) {
            return res.status(400).send({ error: '제공된 이름으로 유효한 멤버를 찾을 수 없습니다.' });
        }

        const members = (await Promise.all(
            memberIds.map(id => guild.members.fetch(id).catch(() => null))
        )).filter(m => m);
        
        // --- 채널 생성 및 권한 설정 로직 ---
        const permissionOverwrites = [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.Connect]
            },
            ...members.map(member => ({
                id: member.user.id,
                allow: [PermissionFlagsBits.Connect]
            }))
        ];

        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        const channelName = `🎉 ${members.length}인 파티 음성채널 (WEB-${randomNumber})`;
        
        const channel = await guild.channels.create({
            name: channelName,
            type: 2,
            permissionOverwrites
        });

        ephemeralChannels.add(channel.id); // 봇이 만든 임시 채널 ID를 Set에 저장

        res.status(200).send({ 
            message: `Party channel created for ${memberIds.length} members.`,
            notFound: notFoundNames 
        });

    } catch (err) {
        console.error('Web Channel creation error:', err);
        res.status(500).send({ error: 'Internal server error during channel creation.' });
    }
});

// ---

// ✅ 슬래시 명령어 등록 (솔로 파티 제거, 옵션 필수화)
const commands = [
    new SlashCommandBuilder()
        .setName('party')
        .setDescription('특정 멤버만 입장할 수 있는 임시 음성채널을 생성합니다')
        .addUserOption(option => // 👈 멘션 문자열 대신 UserOption 사용 권장
            option.setName('user1')
                .setDescription('초대할 멤버 1')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('user2')
                .setDescription('초대할 멤버 2 (선택 사항)'))
        // ... 필요한 만큼 addUserOption 추가 가능
].map(command => command.toJSON());

// 봇이 준비되면 명령어 등록
client.once('ready', async () => {
    console.log(`✅ 로그인됨: ${client.user.tag}`);
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

// ✅ 명령어 실행 시 동작
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'party') {
        const guild = interaction.guild;
        
        // 👈 슬래시 명령어 유저 옵션을 통해 ID 목록을 안전하게 가져옴
        const memberIds = [
            interaction.options.getUser('user1')?.id,
            interaction.options.getUser('user2')?.id,
            // ... 다른 user option ID
        ].filter(id => id); 
        
        // 명령어 사용자는 항상 포함
        if (!memberIds.includes(interaction.user.id)) {
            memberIds.push(interaction.user.id);
        }

        // 👈 솔로 파티 제거: 멤버가 1명 이상이어야 함 (명령어 사용자는 항상 포함되므로)
        if (memberIds.length === 0) {
             return await interaction.reply({ 
                content: '⚠️ 파티를 만들 유효한 멤버를 찾을 수 없습니다.', 
                flags: 1 << 6
            });
        }
        
        try {
            const members = (await Promise.all(
                memberIds.map(id => guild.members.fetch(id).catch(() => null))
            )).filter(m => m);
            
            // ... (채널 생성 및 ID 저장 로직은 웹 엔드포인트와 유사)

            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect] },
                ...members.map(member => ({ id: member.user.id, allow: [PermissionFlagsBits.Connect] }))
            ];

            const randomNumber = Math.floor(Math.random() * 9000) + 1000;
            const channelName = `🎉 ${members.length}인 파티 음성채널 (${randomNumber})`;

            const channel = await guild.channels.create({ name: channelName, type: 2, permissionOverwrites });
            ephemeralChannels.add(channel.id);

            // 👈 성공 로그 추가
            console.log(`🎉 [SLASH] 성공적으로 임시 채널 생성됨: ${channelName} by ${interaction.user.tag}`); 

            await interaction.reply({
                content: `✅ 임시 음성채널 생성됨: ${channel}`,
                ephemeral: false
            });

        } catch (err) {
            console.error(err);
            await interaction.reply({
                content: '⚠️ 채널 생성 중 오류가 발생했습니다. 봇 권한과 서버 ID를 확인해주세요.',
                flags: 1 << 6
            });
        }
    }
});

// ---

// ✅ 음성 채널 상태 변경 감지 이벤트 (ID 관리 로직)
client.on('voiceStateUpdate', (oldState, newState) => {
    // 1. 채널 퇴장 시 (채널이 비었는지 확인)
    if (oldState.channelId && !newState.channelId) {
        const channel = oldState.channel;
        
        // 🎯 핵심: 채널 이름 대신 ephemeralChannels Set에 ID가 있는지 확인
        if (ephemeralChannels.has(channel.id)) { 
            if (channel.members.size === 0) {
                if (!activeChannels.has(channel.id)) {
                    console.log(`✅ ${channel.name} 채널이 비었습니다. 1분 후 삭제됩니다.`);
                    const timer = setTimeout(() => {
                        if (channel.members.size === 0) {
                            channel.delete()
                                .then(deletedChannel => {
                                    console.log(`✅ 비어있는 임시 채널 '${deletedChannel.name}' 삭제 완료`);
                                    ephemeralChannels.delete(deletedChannel.id); 
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

// ✅ 봇 로그인 및 서버 리스닝
client.login(process.env.BOT_TOKEN);
app.listen(port, () => {
    console.log(`✅ 웹 서버가 포트 ${port}에서 구동 중입니다.`);
});
