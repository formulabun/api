import {Client, Intents} from 'discord.js'
import dotenv from 'dotenv';
import _ from 'lodash';
import login from './client/client/interactive.js';
import {getSrb2Info} from 'srb2kartjs';

const {
  discord_token,
  discord_media_channel,
  discord_curator_role,
  discord_curator_emoji,
  kart_ip,
  kart_port,
  INTERVAL,
} = dotenv.config().parsed;

export function getContentFromMessage(message) {
  let content = [];
  if(message.attachments) {
    content = message.attachments.map(a => a.url);   
  }

  if(message.embeds) {
    content = content.concat(message.embeds.map(a => a.url));
  }
  return content;
}

async function isCuratorReaction(user, reaction) {
  const member = await reaction.message.guild?.members.fetch(user);
  const is_curator = member.roles.resolveId(discord_curator_role) || false;

  const is_emoji = reaction.emoji.id === discord_curator_emoji;

  return is_curator && is_emoji;
}

async function fetchMessagesToCache(client) {
  const channel = await client.channels.fetch(discord_media_channel);
  const messages = await channel.messages.fetch({limit:50});
}

async function startClient() {
  const client = await login([Intents.FLAGS.GUILD_MESSAGE_REACTIONS]);

  setInterval(() => {
    getSrb2Info(
      kart_ip,
      kart_port,
      (serverinfo) => {
        client.serverinfo = serverinfo;
      },
      (playerinfo) => {
        client.playerinfo = playerinfo;
      },
      (error) => {
        client.error = error;
      }
    );
  }, parseInt(INTERVAL));

  process.on('exit', () => 
    client.destroy()
  );

  return client;
}

export function curatedContent(client, db) {
  client.on('ready', async () =>  {
    fetchMessagesToCache(client);
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    console.log("reaction");
    if( !await isCuratorReaction(user, reaction) ) return;
    const content = getContentFromMessage(reaction.message);
    content.forEach(c => db.insertDiscordMedia({url:c}, () => {
      console.log("new message reaction");
      console.log(content);
    }));
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    console.log("reaction");
    if( !await isCuratorReaction(user, reaction) ) return;
    console.log("message reaction removed");
  });

  client.on('messageReactionRemove', () => fetchMessagesToCache(client));
  client.on('messageReactionAdd', () => fetchMessagesToCache(client));
}

export function voteResults(client, emitter, db) {
  emitter.on("voteComplete", ({passed, vote}) => {
    if (!passed) return;
    db.getDiscordEventChannels((errors, channelRows) => {
      const channels = channelRows.map(e => e.channelID);
      if (vote.command === "noevent")
        client.sendMessageToMultiple("The current event is cancelled :(", channels);
      else if (vote.command == "yesevent")
        client.sendMessageToMultiple("Event has started again :D", channels);
    });
  });
}

export function sinkMessage(client, emitter, db) {
  emitter.on("kitchenSinkHit", ({player}) => {
    db.getDiscordUpdateChannels((errors, channelRows) => {
      const channels = channelRows.map(e => e.channelID);
      client.sendMessageToMultiple(`${player.name} just got hit by a sink lmao.`, channels);
    });
  });
}

export default function startDiscord() {
  return startClient();
}
