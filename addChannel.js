import prompt from "prompt";
import Srb2KartDatabase from "./db.js";
import {callbackToPromise} from "./db.js";

const schema = {
  properties: {
    typeOf: {
      description: "Type of channel: (1) EventChannel  or (2) UpdateChannel",
      type: "integer",
      required: true,
    },
    channel: {
      description: "ChannelId",
      type: "string",
      required: true,
    },
  },
};

(async () => {
  const db = new Srb2KartDatabase();
  prompt.start();

  prompt.get(schema, async (err, result) => {
    if (err) return;
    switch (result.typeOf) {
      case 1:
        db.insertDiscordEventChannel({channelId:result.channel}, console.log);
        break;
      case 2:
        db.insertDiscordUpdateChannel({channelId:result.channel}, console.log);
        break;
      default:
        console.error("invalid channel type");
    }
  });
})();
