import Srb2KartDatabase from './db.js';
import {logger} from 'srb2kartjs';
import dotenv from 'dotenv';

const {
  log_path
} = dotenv.config().parsed;


export default async function startLogging() {
  const logs = logger(log_path);

  /*logs.on('serverStart', () => db.insertServerBoot({unixtime: Date.now()}));

  logs.on('playerJoin', ({name, ip, node}) => {
    db.insertPlayerCountChange({isJoin: true, node, ip, port:0, unixtime: Date.now()});
  });
  logs.on('playerLeave', ({name, ip, node}) => {
    db.insertPlayerCountChange({isJoin: false, node, ip, port:0, unixtime: Date.now()});
  });

  logs.on('playerRename', ({oldName, newName, player}) => {
    db.insertPlayerRename({oldName, newName, port:0, ...player, unixtime:Date.now()})
  });*/

  return logs;
}
