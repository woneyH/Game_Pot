// 1. 주요 클래스 및 모듈 가져오기
const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    REST, 
    Routes, 
    PermissionFlagsBits,
    MessageFlags, // [필수] 플래그 사용
    Events        // [필수] 이벤트 상수 사용
} = require('discord.js');
const express = require('express');
const cors = require('cors'); 
require('dotenv').config();

// ✅ REST 클라이언트 초기화
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ✅ 채널 관리용 Map과 Set
const activeChannels = new Map();
const ephemeralChannels = new Set(); 
const activeVotes = new Set();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions // [NEW] 이모지 반응 감지 권한 필수
    ]
});

// --- Express 서버 설정 ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 

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

// ✅ 슬래시 명령어 등록
const commands = [
    new SlashCommandBuilder()
        .setName('party')
        .setDescription('특정 멤버만 입장할 수 있는 임시 음성채널을 생성합니다')
        .addUserOption(option => 
            option.setName('user1').setDescription('초대할 멤버 1').setRequired(true))
        .addUserOption(option => 
            option.setName('user2').setDescription('초대할 멤버 2 (선택 사항)')),
    
    new SlashCommandBuilder()
        .setName('votekick')
        .setDescription('현재 음성 채널에서 투표를 통해 멤버를 추방합니다.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('추방할 멤버')
                .setRequired(true))

].map(command => command.toJSON());

client.once(Events.ClientReady, async () => {
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log(`✅ Logged in as ${client.user.tag}`);
    } catch (error) {
        console.error('⚠️ 슬래시 명령어 등록 중 오류 발생:', error);
    }
});

// ✅ 명령어 실행 시 동작
client.on(Events.InteractionCreate, async (interaction) => {
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
              return await interaction.reply({ 
                  content: '⚠️ 유효한 멤버를 찾을 수 없습니다.', 
                  flags: MessageFlags.Ephemeral 
              });
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
                content: `✅ 임시 음성채널 생성됨: ${channel} \n🔗 **초대 링크:** ${inviteLink}`
            });

        } catch (err) {
            console.error(err);
            await interaction.reply({ 
                content: '⚠️ 오류 발생', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }

    // 2. VOTEKICK 명령어 (이모지 버전)
    if (commandName === 'votekick') {
        if (!member.voice.channelId || !ephemeralChannels.has(member.voice.channelId)) {
            return await interaction.reply({ 
                content: '⚠️ 이 명령어는 봇이 생성한 임시 음성 채널 내부에서만 사용할 수 있습니다.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        if (activeVotes.has(member.voice.channelId)) {
            return await interaction.reply({ 
                content: '⚠️ 이 채널에서 이미 투표가 진행 중입니다.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const targetUser = interaction.options.getUser('target');
        const targetMember = guild.members.cache.get(targetUser.id);
        const voiceChannel = member.voice.channel;

        if (!targetMember || targetMember.voice.channelId !== voiceChannel.id) {
            return await interaction.reply({ 
                content: '⚠️ 대상이 현재 음성 채널에 없습니다.', 
                flags: MessageFlags.Ephemeral 
            });
        }
        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({ 
                content: '⚠️ 자기 자신을 추방할 수 없습니다.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        activeVotes.add(voiceChannel.id);
        
        const voters = voiceChannel.members.filter(m => !m.user.bot); 
        const totalVoters = voters.size;
        // 과반수 계산 (예: 3명이면 2표)
        const requiredVotes = Math.ceil(totalVoters / 2) + (totalVoters % 2 === 0 ? 1 : 0); 

        // 1. 메시지 전송
        await interaction.reply({
            content: `📢 **추방 투표 시작!**\n대상: ${targetMember}\n사유: ${interaction.user}님의 요청\n\n30초 내에 **${requiredVotes}명 이상**이 👍를 누르면 추방됩니다.\n(반대는 👎를 눌러주세요)`,
            fetchReply: false // 여기서는 필요 없음, 아래에서 따로 호출
        });

        const message = await interaction.fetchReply();

        try {
            // 2. 이모지 부착
            await message.react('👍');
            await message.react('👎');
        } catch (error) {
            console.error('이모지 반응 실패 (채널 삭제됨?):', error);
            activeVotes.delete(voiceChannel.id);
            return;
        }

        // 3. 이모지 수집기 생성 (30초)
        const filter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
        };

        const collector = message.createReactionCollector({ filter, time: 30000 });

        collector.on('end', async (collected) => {
            activeVotes.delete(voiceChannel.id);

            // 채널이 아직 존재하는지 확인
            try {
                // 봇의 반응 1개씩 빼기
                const thumbsUp = (collected.get('👍')?.count || 1) - 1;
                const thumbsDown = (collected.get('👎')?.count || 1) - 1;

                if (thumbsUp >= requiredVotes && thumbsUp > thumbsDown) {
                    try {
                        await targetMember.voice.disconnect(`Vote kicked`);
                        await voiceChannel.permissionOverwrites.edit(targetMember, { Connect: false });
                        await interaction.followUp(`✅ **투표 가결!** (찬성 ${thumbsUp}표)\n${targetMember} 님이 추방되었습니다.`);
                    } catch (e) {
                        await interaction.followUp(`⚠️ 가결되었으나 권한 부족으로 추방 실패.`);
                    }
                } else {
                    await interaction.followUp(`❌ **투표 부결.** (찬성 ${thumbsUp} / 반대 ${thumbsDown})\n과반수를 넘지 못했거나 반대가 더 많습니다.`);
                }
            } catch (error) {
                // 채널이 사라졌거나 메시지를 못 보낼 때 (Unknown Channel 무시)
                if (error.code !== 10003) console.error('투표 결과 처리 중 오류:', error);
            }
        });
    }
});

// ---

// ✅ 음성 채널 관리 및 서버 시작
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channelId && !newState.channelId) {
        const channel = oldState.channel;
        
        if (ephemeralChannels.has(channel.id)) { 
            if (channel.members.size === 0) {
                if (!activeChannels.has(channel.id)) {
                    const timer = setTimeout(() => {
                        client.channels.fetch(channel.id).then(ch => {
                            if (ch && ch.members.size === 0) {
                                ch.delete().catch(() => {});
                                ephemeralChannels.delete(channel.id);
                                activeVotes.delete(channel.id);
                            }
                        }).catch(() => {
                             ephemeralChannels.delete(channel.id);
                             activeVotes.delete(channel.id);
                        });
                        activeChannels.delete(channel.id);
                    }, 60000);
                    activeChannels.set(channel.id, timer);
                }
            }
        }
    }

    if (!oldState.channelId && newState.channelId) {
        const channel = newState.channel;
        if (activeChannels.has(channel.id)) {
            clearTimeout(activeChannels.get(channel.id));
            activeChannels.delete(channel.id);
        }
    }
});

client.login(process.env.BOT_TOKEN);

app.listen(port, () => {
    console.log(`✅ Discord Bot service started on port ${port}`);

    const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
    if (process.env.RENDER_EXTERNAL_URL) {
        setInterval(() => {
            fetch(SELF_URL).catch(() => {});
        }, 10 * 60 * 1000);
    }
});
