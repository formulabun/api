import {Client} from 'discord.js'
import dotenv from 'dotenv';
import _ from 'lodash';
import Srb2KartDatabase from './db.js';
import FormulaBunBot from './discord/client.js';
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
  const member = await reaction.message.guild?.members.fetch(user.id);
  const is_curator = member.roles.cache.get(discord_curator_role) || false;

  const is_emoji = reaction.emoji.id === discord_curator_emoji;

  return is_curator && is_emoji;
}

async function fetchMessagesToCache(client) {
  const channel = await client.channels.fetch(discord_media_channel);
  channel.messages.fetch({limit:50});
}

function startClient() {
  const client = new FormulaBunBot();
  client.login(discord_token);

  const db = new Srb2KartDatabase();

  client.on('ready', async () =>  {
    fetchMessagesToCache(client);
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    if( !await isCuratorReaction(user, reaction) ) return;
    const content = getContentFromMessage(reaction.message);
    content.forEach(c => db.insertDiscordMedia({url:c}, () => {
      console.log("new message reaction");
      console.log(content);
    }));
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    if( !await isCuratorReaction(user, reaction) ) return;
    console.log("message reaction removed");
  });

  client.on('messageReactionRemove', () => fetchMessagesToCache(client));
  client.on('messageReactionAdd', () => fetchMessagesToCache(client));

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

export default function startDiscord() {
  return startClient();
}
