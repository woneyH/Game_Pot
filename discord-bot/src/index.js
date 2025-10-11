// 1. 주요 클래스 및 모듈 가져오기
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const cors = require('cors'); 
require('dotenv').config();

// ✅ REST 클라이언트 초기화
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ✅ 채널 관리용 Map과 Set
const activeChannels = new Map();
const ephemeralChannels = new Set(); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers // 멤버 캐싱 인텐트
    ]
});

// --- Express 서버 설정 ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // CORS 설정 (모든 외부 요청 허용)
app.use(express.json()); 

// 24시간 구동을 위한 Ping 엔드포인트
app.get('/', (req, res) => {
    res.status(200).send('Discord Bot is running and ready for pings.');
});

// ✅ 웹사이트 파티 생성 엔드포인트
const TARGET_GUILD_ID = '1420237416718929971'; // 👈 여기에 서버 ID 입력 필수!

// 유저 ID 배열의 유효성을 검사하는 헬퍼 함수
function ArrayOfStringsOrNumbers(arr) {
    return Array.isArray(arr) && arr.every(item => typeof item === 'string' || typeof item === 'number');
}

app.post('/api/create-party', async (req, res) => {
    const { memberIds } = req.body; 

    // 1. 유효성 검사
    if (!memberIds || !ArrayOfStringsOrNumbers(memberIds) || memberIds.length === 0) {
        return res.status(400).send({ error: '유저 ID 배열(memberIds)이 비어있거나 올바르지 않습니다.' });
    }

    const guild = client.guilds.cache.get(TARGET_GUILD_ID); 
    if (!guild) {
        return res.status(500).send({ error: 'Target Discord Server not found or bot not invited.' });
    }

    try {
        // 🎯 2. fetch를 사용하여 유효성 검사 및 멤버 정보 가져오기 (정확성 확보)
        const fetchedMembers = await Promise.all(
            memberIds.map(id => 
                guild.members.fetch(id).catch(() => null) 
            )
        );

        // 3. 유효한 멤버만 필터링
        const members = fetchedMembers.filter(m => m);
        
        // 4. 찾지 못한 ID 확인
        const foundIds = members.map(m => m.id);
        const notFoundIds = memberIds.filter(id => !foundIds.includes(id));

        if (members.length === 0) {
            return res.status(400).send({ error: '제공된 ID로 유효한 멤버를 찾을 수 없습니다. 서버 가입 상태를 확인하세요.' });
        }
        
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

        ephemeralChannels.add(channel.id); 

        // 🎯 초대 링크 생성 로직
        let inviteLink = "링크 생성 실패";
        try {
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });
            inviteLink = invite.url;
        } catch (inviteError) {
            // 콘솔에만 오류 출력 (외부 응답에는 포함되지 않음)
            console.error("⚠️ 웹 요청 처리 중 초대 링크 생성 권한 오류:", inviteError);
        }

        res.status(200).send({ 
            message: `Party channel created for ${members.length} members.`,
            inviteLink: inviteLink, 
            notFoundIds: notFoundIds 
        });

    } catch (err) {
        // Timeout 오류 발생 시 503 오류와 함께 상세 코드 반환
        if (err.code === 'GuildMembersTimeout') {
             // 🎯 콘솔에만 오류 출력
             console.error('Web Channel creation error: GuildMembersTimeout');
             return res.status(503).send({ error: '서버 통신 시간 초과 (Discord API Timeout). 잠시 후 다시 시도하세요.' });
        }
        console.error('Web Channel creation fatal error:', err);
        res.status(500).send({ error: `내부 서버 오류: ${err.code || 'Internal Error'}` });
    }
});

// ---

// ✅ 슬래시 명령어 등록 (SLASH COMMANDS)
const commands = [
    new SlashCommandBuilder()
        .setName('party')
        .setDescription('특정 멤버만 입장할 수 있는 임시 음성채널을 생성합니다')
        .addUserOption(option => 
            option.setName('user1')
                .setDescription('초대할 멤버 1')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('user2')
                .setDescription('초대할 멤버 2 (선택 사항)'))
        // ... 필요한 만큼 addUserOption 추가
].map(command => command.toJSON());

// 봇이 준비되면 명령어 등록
client.once('ready', async () => {
    // 🎯 불필요한 로그 제거: console.log(`✅ 로그인됨: ${client.user.tag}`);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        // 🎯 불필요한 로그 제거: console.log('✅ 슬래시 명령어 등록 완료');
    } catch (error) {
        console.error('⚠️ 슬래시 명령어 등록 중 오류 발생:', error);
    }
});

// ✅ 명령어 실행 시 동작
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'party') {
        const guild = interaction.guild;
        
        const memberIds = [
            interaction.options.getUser('user1')?.id,
            interaction.options.getUser('user2')?.id,
        ].filter(id => id); 
        
        if (!memberIds.includes(interaction.user.id)) {
            memberIds.push(interaction.user.id);
        }

        if (memberIds.length === 0) {
              return await interaction.reply({ 
                content: '⚠️ 파티를 만들 유효한 멤버를 찾을 수 없습니다.', 
                flags: 1 << 6
            });
        }
        
        try {
            // 슬래시 명령어는 이미 유효성 검사를 거치므로 캐시만 사용합니다.
            const members = memberIds.map(id => guild.members.cache.get(id)).filter(m => m);
            
            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect] },
                ...members.map(member => ({ id: member.user.id, allow: [PermissionFlagsBits.Connect] }))
            ];

            const randomNumber = Math.floor(Math.random() * 9000) + 1000;
            const channelName = `🎉 ${members.length}인 파티 음성채널 (${randomNumber})`;

            const channel = await guild.channels.create({ name: channelName, type: 2, permissionOverwrites });
            ephemeralChannels.add(channel.id);

            // 초대 링크 생성 로직
            let inviteLink = "링크 생성 실패";
            try {
                const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });
                inviteLink = invite.url;
            } catch (inviteError) {
                // 🎯 불필요한 로그 제거: console.error("⚠️ 슬래시 명령 중 초대 링크 생성 권한 오류:", inviteError);
            }
            
            // 🎯 불필요한 로그 제거: console.log(`🎉 [SLASH] 성공적으로 임시 채널 생성됨: ${channelName}. 링크: ${inviteLink}`); 

            await interaction.reply({
                content: `✅ 임시 음성채널 생성됨: ${channel} \n🔗 **초대 링크:** ${inviteLink}`,
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
        
        if (ephemeralChannels.has(channel.id)) { 
            if (channel.members.size === 0) {
                if (!activeChannels.has(channel.id)) {
                    // 🎯 불필요한 로그 제거: console.log(`✅ ${channel.name} 채널이 비었습니다. 1분 후 삭제됩니다.`);
                    const timer = setTimeout(() => {
                        if (channel.members.size === 0) {
                            channel.delete()
                                .then(deletedChannel => {
                                    // 🎯 불필요한 로그 제거: console.log(`✅ 비어있는 임시 채널 '${deletedChannel.name}' 삭제 완료`);
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
        }
    }
});

// ---

// ✅ 봇 로그인 및 서버 리스닝
client.login(process.env.BOT_TOKEN);
app.listen(port, () => {
    // 봇이 켜졌는지 확인하는 필수 로그만 남김
    console.log(`✅ Discord Bot service started on port ${port}`);
});
