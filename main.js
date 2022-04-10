import startLogging from './logs.js';
import startApi from './api.js';
import startDiscord from './discord_api.js';
import Srb2KartDatabase from './db.js';
import {
  curatedContent,
  voteResults
} from './discord_api.js';

(async () => {
  // produce
  const db = new Srb2KartDatabase();
  const logEmitter = await startLogging();
  const discord = await startDiscord();

  // consume
  startApi(db);
  curatedContent(discord, db);
  voteResults(discord, logEmitter, db);
})();
