import sqlite3 from 'sqlite3';

function callbackToPromise(func) {
  return function(param={}){
    return new Promise((accept, reject) => {
      func((error, rows) => {
        if(error) reject(error);
        accept(rows);
      }, param)
    })
  }
}

const databasefile = "./db.sqlite"

let db;
function getDatabase() {
  if(!db)
    sqlite3.verbose();
    db = new sqlite3.Database(databasefile);
  return db
}

function closeDatabase() {
  db.close();
}

function createDatabase(cb) {
  db = getDatabase();
  db.run(`
    CREATE TABLE IF NOT EXISTS ServerBoot (
      unixtime integer NOT NULL
  )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS PlayerCountChange (
      action CHAR NOT NULL,
      node CHAR NOT NULL,
      ip TEXT NOT NULL,
      port TEXT NOT NULL,
      unixtime integer NOT NULL
  )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS PlayerRename (
      oldName TEXT NOT NULL,
      newName TEXT NOT NULL,
      node integer NOT NULL,
      ip TEXT NOT NULL,
      port TEXT NOT NULL,
      unixtime integer NOT NULL
    )`);
  db.close();
}

function insertServerBoot(cb, {datetime = Date.now()}) {
  db = getDatabase();
  db.run(`
    INSERT INTO ServerBoot (unixtime)
    VALUES ($datetime)
    `, datetime, cb);
}
const insertServerBootPromise = callbackToPromise(insertServerBoot);

function insertPlayerCountChange(cb, {isJoin, node, ip, port, datetime=Date.now()}) {
  db = getDatabase();
  db.run(`
    INSERT INTO PlayerCountChange (action, node, ip, port, unixtime)
    VALUES ($action, $ip, $node, $datetime)
    `, {
      action: (isJoin ? "join" : "leave"),
      node,
      ip,
      port,
      datetime,
    }, cb);
}
const insertPlayerCountChangePromise = callbackToPromise(insertPlayerCountChange);

function insertPlayerRename(cb, {oldname, newname, node, ip, port, unixtime=Date.now()}) {
  db = getDatabase();
  db.run(`
    INSERT INTO PlayerRename (oldname, newname, node, ip, port, unixtime)
    VALUES ($oldname, $newname, $node, $ip, $port, $unixtime)
    `, {
      oldname,
      newname,
      node,
      ip,
      port,
      unixtime
    }, cb);
}
const insertPlayerRenamePromise = callbackToPromise(insertPlayerRename);

function getPlayerChangeSinceLastBoot(cb) {
  db = getDatabase();
  db.get(`
    SELECT unixtime FROM ServerBoot
    ORDER BY unixtime DESC
    LIMIT 1
    `, (error, row) => {
      if(error || !row?.unixtime) {
        console.error(error);
        return;
      }
      db.all(`
        SELECT * FROM PlayerChange
        WHERE PlayerChange.unixtime >= ?
        `, row.unixtime, cb)
    });
}
const getPlayerChangeSinceLastBootPromise = callbackToPromise(getPlayerChangeSinceLastBoot);


export {
  getDatabase,
  closeDatabase,
  createDatabase,
  insertServerBoot,
  insertServerBootPromise,
  insertPlayerCountChange,
  insertPlayerCountChangePromise,
  getPlayerChangeSinceLastBoot,
  getPlayerChangeSinceLastBootPromise,
}
