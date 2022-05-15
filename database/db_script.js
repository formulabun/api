import Srb2KartDatabase from './db.js';

const db = new Srb2KartDatabase("./db.sqlite", () => {

  db.insertDiscordMedia({url:"https://cdn.discordapp.com/attachments/836651419087011865/936668798663143434/kart0038.gif"}, () => {
    db.getDiscordMedia({}, (e, v) => console.log(e || v));
  });
});

