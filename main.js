import startLogging from './logs/index.js';
import startApi from './webapi/index.js';
import startDiscord from './discord/index.js';
import Srb2KartDatabase from './database/db.js';
import {
  curatedContent,
  sinkMessage
} from './discord/index.js';

(async () => {
  // produce
  const db = new Srb2KartDatabase();
  const logEmitter = await startLogging();
  const discord = await startDiscord();

  // consume
  startApi(db);
  curatedContent(discord, db);
  sinkMessage(discord, logEmitter, db);
})();
