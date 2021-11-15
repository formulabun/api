import Srb2KartDatabase from './db.js';
import logger from 'srb2kartinfoparse/log.js';

export default  function startLogging() {
  (async () => {
    const logs = logger('/home/fguilini/.srb2kart/log.txt');
    const db = await (new Promise((res, rej) => new Srb2KartDatabase('./db.sqlite', res)));
    console.log("ok");

    logs.on('serverStart', () => db.insertServerBoot({unixtime: Date.now()}));

    logs.on('playerJoin', ({name, ip, node}) => {
      db.insertPlayerCountChange({isJoin: true, node, ip, port:0, unixtime: Date.now()});
    });
    logs.on('playerLeave', ({name, ip, node}) => {
      db.insertPlayerCountChange({isJoin: false, node, ip, port:0, unixtime: Date.now()});
    });

    logs.on('playerRename', ({oldName, newName, player}) => {
      db.insertPlayerRename({oldName, newName, port:0, ...player, unixtime:Date.now()})
    });
  })();
}
