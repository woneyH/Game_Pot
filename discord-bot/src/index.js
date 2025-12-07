// 1. 주요 클래스 및 모듈 가져오기
const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    REST, 
    Routes, 
    PermissionFlagsBits,
    ActionRowBuilder, // [NEW] 버튼 생성용
    ButtonBuilder,    // [NEW] 버튼 생성용
    ButtonStyle       // [NEW] 버튼 스타일
} = require('discord.js');
const express = require('express');
const cors = require('cors'); 
// Node.js 18+ 에서는 fetch가 내장되어 있지만, 하위 버전 호환을 위해 필요시 node-fetch 설치 필요
// const fetch = require('node-fetch'); 
require('dotenv').config();

// ✅ REST 클라이언트 초기화
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ✅ 채널 관리용 Map과 Set
const activeChannels = new Map();
const ephemeralChannels = new Set(); 
// [NEW] 진행 중인 투표 관리 (중복 투표 방지용)
const activeVotes = new Set();

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

app.use(cors());
app.use(express.json()); 

// 24시간 구동을 위한 Ping 엔드포인트
app.get('/', (req, res) => {
    res.status(200).send('Discord Bot is running and ready for pings.');
});

// ✅ 웹사이트 파티 생성 엔드포인트
const TARGET_GUILD_ID = '1420237416718929971'; 

function ArrayOfStringsOrNumbers(arr) {
    return Array.isArray(arr) && arr.every(item => typeof item === 'string' || typeof item === 'number');
}

app.post('/api/create-party', async (req, res) => {
    const { memberIds } = req.body; 

    if (!memberIds || !ArrayOfStringsOrNumbers(memberIds) || memberIds.length === 0) {
        return res.status(400).send({ error: '유저 ID 배열(memberIds)이 비어있거나 올바르지 않습니다.' });
    }

    const guild = client.guilds.cache.get(TARGET_GUILD_ID); 
    if (!guild) {
        return res.status(500).send({ error: 'Target Discord Server not found or bot not invited.' });
    }

    try {
        const fetchedMembers = await Promise.all(
            memberIds.map(id => 
                guild.members.fetch(id).catch(() => null) 
            )
        );

        const members = fetchedMembers.filter(m => m);
        const foundIds = members.map(m => m.id);
        const notFoundIds = memberIds.filter(id => !foundIds.includes(id));

        if (members.length === 0) {
            return res.status(400).send({ error: '제공된 ID로 유효한 멤버를 찾을 수 없습니다.' });
        }
        
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

        let inviteLink = "링크 생성 실패";
        try {
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });
            inviteLink = invite.url;
        } catch (inviteError) {
            console.error("⚠️ 웹 요청 처리 중 초대 링크 생성 권한 오류:", inviteError);
        }

        res.status(200).send({ 
            message: `Party channel created for ${members.length} members.`,
            inviteLink: inviteLink, 
            notFoundIds: notFoundIds 
        });

    } catch (err) {
        if (err.code === 'GuildMembersTimeout') {
             console.error('Web Channel creation error: GuildMembersTimeout');
             return res.status(503).send({ error: '서버 통신 시간 초과. 잠시 후 다시 시도하세요.' });
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
            option.setName('user1').setDescription('초대할 멤버 1').setRequired(true))
        .addUserOption(option => 
            option.setName('user2').setDescription('초대할 멤버 2 (선택 사항)')),
    
    // [NEW] 투표 추방 명령어 추가
    new SlashCommandBuilder()
        .setName('votekick')
        .setDescription('현재 음성 채널에서 투표를 통해 멤버를 추방합니다.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('추방할 멤버')
                .setRequired(true))

].map(command => command.toJSON());

client.once('ready', async () => {
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
    } catch (error) {
        console.error('⚠️ 슬래시 명령어 등록 중 오류 발생:', error);
    }
});

// ✅ 명령어 실행 시 동작
client.on('interactionCreate', async (interaction) => {
    // 버튼 이벤트 처리 (투표)
    if (interaction.isButton()) return; // 버튼 처리는 collector에서 하므로 여기서는 패스하거나 별도 핸들러 필요시 작성

    if (!interaction.isChatInputCommand()) return;

    const { commandName, guild, member } = interaction;

    // 1. PARTY 명령어
    if (commandName === 'party') {
        const memberIds = [
            interaction.options.getUser('user1')?.id,
            interaction.options.getUser('user2')?.id,
        ].filter(id => id); 
        
        if (!memberIds.includes(interaction.user.id)) {
            memberIds.push(interaction.user.id);
        }

        if (memberIds.length === 0) {
              return await interaction.reply({ content: '⚠️ 유효한 멤버를 찾을 수 없습니다.', flags: 1 << 6 });
        }
        
        try {
            const members = memberIds.map(id => guild.members.cache.get(id)).filter(m => m);
            
            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect] },
                ...members.map(member => ({ id: member.user.id, allow: [PermissionFlagsBits.Connect] }))
            ];

            const randomNumber = Math.floor(Math.random() * 9000) + 1000;
            const channelName = `🎉 ${members.length}인 파티 음성채널 (${randomNumber})`;

            const channel = await guild.channels.create({ name: channelName, type: 2, permissionOverwrites });
            ephemeralChannels.add(channel.id);

            let inviteLink = "링크 생성 실패";
            try {
                const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });
                inviteLink = invite.url;
            } catch (inviteError) {}
            
            await interaction.reply({
                content: `✅ 임시 음성채널 생성됨: ${channel} \n🔗 **초대 링크:** ${inviteLink}`,
                ephemeral: false
            });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '⚠️ 오류 발생', flags: 1 << 6 });
        }
    }

    // [NEW] 2. VOTEKICK 명령어
    if (commandName === 'votekick') {
        // 1) 봇이 관리하는 임시 채널인지 확인
        if (!member.voice.channelId || !ephemeralChannels.has(member.voice.channelId)) {
            return await interaction.reply({ 
                content: '⚠️ 이 명령어는 봇이 생성한 임시 음성 채널 내부에서만 사용할 수 있습니다.', 
                ephemeral: true 
            });
        }

        // 2) 이미 투표가 진행 중인지 확인
        if (activeVotes.has(member.voice.channelId)) {
            return await interaction.reply({ 
                content: '⚠️ 이 채널에서 이미 투표가 진행 중입니다.', 
                ephemeral: true 
            });
        }

        const targetUser = interaction.options.getUser('target');
        const targetMember = guild.members.cache.get(targetUser.id);
        const voiceChannel = member.voice.channel;

        // 3) 대상 검증
        if (!targetMember || targetMember.voice.channelId !== voiceChannel.id) {
            return await interaction.reply({ content: '⚠️ 대상이 현재 음성 채널에 없습니다.', ephemeral: true });
        }
        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({ content: '⚠️ 자기 자신을 추방할 수 없습니다.', ephemeral: true });
        }

        // 4) 투표 로직 시작
        activeVotes.add(voiceChannel.id);
        
        // 봇을 제외한 현재 채널 인원
        const voters = voiceChannel.members.filter(m => !m.user.bot); 
        const totalVoters = voters.size;
        // 과반수 기준 (예: 3명이면 2표 필요)
        const requiredVotes = Math.ceil(totalVoters / 2) + (totalVoters % 2 === 0 ? 1 : 0); 

        const confirmButton = new ButtonBuilder()
            .setCustomId('kick_yes')
            .setLabel(`찬성 (0/${requiredVotes})`)
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirmButton);

        // [FIXED] fetchReply: true 옵션을 제거하고 명시적으로 호출합니다.
        await interaction.reply({
            content: `📢 **추방 투표 시작!**\n대상: ${targetMember}\n사유: ${interaction.user}님의 요청\n\n30초 내에 **${requiredVotes}명** 이상이 찬성하면 추방됩니다.`,
            components: [row]
        });

        // [FIXED] 메시지 객체를 여기서 따로 가져옵니다.
        const response = await interaction.fetchReply();

        const collector = response.createMessageComponentCollector({ 
            componentType: 1, // ComponentType.Button
            time: 30000 
        });

        const votedUsers = new Set();
        let voteCount = 0;

        collector.on('collect', async i => {
            if (i.customId === 'kick_yes') {
                if (votedUsers.has(i.user.id)) {
                    return i.reply({ content: '이미 투표하셨습니다.', ephemeral: true });
                }

                // 투표자가 해당 음성채널에 있는지 확인 (나간 사람 투표 방지)
                if (i.member.voice.channelId !== voiceChannel.id) {
                    return i.reply({ content: '채널에 있는 사람만 투표할 수 있습니다.', ephemeral: true });
                }

                votedUsers.add(i.user.id);
                voteCount++;

                // 버튼 라벨 업데이트
                const updatedBtn = ButtonBuilder.from(confirmButton).setLabel(`찬성 (${voteCount}/${requiredVotes})`);
                const updatedRow = new ActionRowBuilder().addComponents(updatedBtn);
                
                await i.update({ components: [updatedRow] });

                // 과반수 달성 시 조기 종료
                if (voteCount >= requiredVotes) {
                    collector.stop('passed');
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            activeVotes.delete(voiceChannel.id);
            
            if (reason === 'passed') {
                try {
                    // 음성 채널 연결 끊기
                    await targetMember.voice.disconnect(`Vote kicked by channel members`);
                    // (선택) 채널 권한도 제거하여 재입장 막기
                    await voiceChannel.permissionOverwrites.edit(targetMember, { Connect: false });

                    await interaction.followUp(`✅ **투표 가결!** ${targetMember} 님이 채널에서 추방되었습니다.`);
                } catch (e) {
                    await interaction.followUp(`⚠️ 투표는 가결되었으나, 권한 부족으로 추방하지 못했습니다.`);
                }
            } else {
                await interaction.followUp(`❌ **투표 부결.** 시간 초과 또는 찬성표 부족.`);
            }
            
            // 투표 종료 후 버튼 비활성화
            const disabledRow = new ActionRowBuilder().addComponents(
                ButtonBuilder.from(confirmButton).setLabel('투표 종료').setDisabled(true)
            );
            await interaction.editReply({ components: [disabledRow] });
        });
    }
});

// ---

// ✅ 음성 채널 상태 변경 감지 이벤트 (ID 관리 로직)
client.on('voiceStateUpdate', (oldState, newState) => {
    // 1. 채널 퇴장 시
    if (oldState.channelId && !newState.channelId) {
        const channel = oldState.channel;
        
        if (ephemeralChannels.has(channel.id)) { 
            if (channel.members.size === 0) {
                if (!activeChannels.has(channel.id)) {
                    const timer = setTimeout(() => {
                        if (channel.members.size === 0) {
                            channel.delete()
                                .then(deletedChannel => {
                                    ephemeralChannels.delete(deletedChannel.id); 
                                    activeVotes.delete(deletedChannel.id); // [UPDATE] 채널 삭제 시 투표 상태도 정리
                                })
                                .catch(err => console.error(`⚠️ 채널 삭제 오류: ${err}`));
                        }
                        activeChannels.delete(channel.id);
                    }, 60000);
                    activeChannels.set(channel.id, timer);
                }
            }
        }
    }

    // 2. 채널 입장 시
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
    console.log(`✅ Discord Bot service started on port ${port}`);

    // [NEW] 24시간 구동을 위한 Self-Ping (Keep-Alive) 로직
    const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
    
    if (process.env.RENDER_EXTERNAL_URL) { // 배포 환경일 때만 실행 권장
        setInterval(() => {
            fetch(SELF_URL)
                .then(res => console.log(`🔄 Keep-Alive Ping Sent: ${res.status}`))
                .catch(err => console.error(`⚠️ Keep-Alive Ping Failed: ${err.message}`));
        }, 10 * 60 * 1000); // 10분 주기 (밀리초)
    }
});
