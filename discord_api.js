import {Client} from 'discord.js'
import dotenv from 'dotenv';
import _ from 'lodash';
import Srb2KartDatabase from './db.js';

const {
  discord_token,
  discord_media_channel,
  discord_curator_role,
  discord_curator_emoji,
} = dotenv.config().parsed;

function gifEmbedFilter(message) {
  if( ! message.attachments ) return;
  return message.attachments.map(a => a.url);
}

function getContentFromMessage(message) {
  const filters = [gifEmbedFilter];
  const res = filters.map(f => f(message));;
  return _.flattenDepth(res, 2);
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

async function startClient() {
  const client = new Client();
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
  return client;
}

export default async function startDiscord() {
  return startClient();
}
