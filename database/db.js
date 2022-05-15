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

export default class Srb2KartDatabase {
  constructor(file='./db.sqlite3', cb) {
    sqlite3.verbose();
    this.db = new sqlite3.Database(file);
    this.initialize(cb);
  }

  get sqlite3database() {
    return this.db;
  }

  clear(cb) {
    this.db.serialize();
    this.db.run(`
      DROP TABLE IF EXISTS ServerBoot
      `);
    this.db.run(`
      DROP TABLE IF EXISTS PlayerCountChange
      `);
    this.db.run(`
      DROP TABLE IF EXISTS PlayerRename
      `);
    this.initialize(cb);
    this.db.parallelize();
  }

  close(cb) {
    this.db.close(() => {this.db = undefined; cb()});
  }

  initialize(cb) {
    Promise.all([new Promise((res, rej) => this.db.run(`
      CREATE TABLE IF NOT EXISTS ServerBoot (
        unixtime integer NOT NULL
    )`, (e) => {
      if(e) rej(e); res();
    })),
    new Promise((res, rej) => this.db.run(`;
      CREATE TABLE IF NOT EXISTS PlayerCountChange (
        action CHAR NOT NULL,
        node CHAR NOT NULL,
        ip TEXT NOT NULL,
        port TEXT NOT NULL,
        unixtime integer NOT NULL
    )`, (e) => {
      if(e) rej(e); res();
    })),
    new Promise((res, rej) => this.db.run(`
      CREATE TABLE IF NOT EXISTS PlayerRename (
        oldName TEXT NOT NULL,
        newName TEXT NOT NULL,
        node CHAR NOT NULL,
        ip TEXT NOT NULL,
        port TEXT NOT NULL,
        unixtime integer NOT NULL
      )`, (e) => {
      if(e) rej(e); res();
    })),
    new Promise((res, rej) => this.db.run(`
      CREATE TABLE IF NOT EXISTS DiscordMedia (
        url TEXT NOT NULL UNIQUE,
        unixtime integer NOT NULL
      )`, (e) => {
        if(e) rej(e); res();
    })),
    new Promise((res, rej) => this.db.run(`
      CREATE TABLE IF NOT EXISTS
        EventChannels (
          channelID PRIMARY KEY
        )
    `, (e) => {
      if(e) rej(e); res();
    })),
    new Promise((res, rej) => this.db.run(`
      CREATE TABLE IF NOT EXISTS
        UpdateChannels (
          channelID PRIMARY KEY
        )
    `, (e) => {
      if(e) rej(e); res();
    })),
    ]).then(cb);
  }

  insertServerBoot({unixtime = Date.now()}, cb) {
    this.db.run(`
      INSERT INTO ServerBoot (unixtime)
      VALUES ($unixtime)
      `, unixtime, cb);
  }

  insertPlayerCountChange({isJoin, node, ip, port, unixtime=Date.now()}, cb) {
    this.db.run(`
      INSERT INTO PlayerCountChange (action, node, ip, port, unixtime)
      VALUES ($action, $node, $ip, $port, $unixtime)
      `, [
        (isJoin ? "join" : "leave"),
        node,
        ip,
        port,
        unixtime,
      ], cb);
  }

  insertPlayerRename({oldName, newName, node, ip, port, unixtime=Date.now()}, cb) {
    this.db.run(`
      INSERT INTO PlayerRename (oldname, newname, node, ip, port, unixtime)
      VALUES ($oldName, $newName, $node, $ip, $port, $unixtime)
      `, [
        oldName,
        newName,
        node,
        ip,
        port,
        unixtime
      ], cb);
  }

  insertDiscordMedia({url, unixtime=Date.now()}, cb) {
    this.db.run(`
    INSERT INTO DiscordMedia (url, unixtime)
    VALUES ($url, $unixtime)
    `, [
      url,
      unixtime
    ], cb);
  }

  _insertDiscordChannel({channelId}, column, cb) {
    if (column !== "UpdateChannels" && column !== "EventChannels")
      throw new Error("incorrect column name");
    if (typeof channelId != "string")
      throw new Error("channelId must be a string");
    this.db.prepare(`
      INSERT OR IGNORE INTO ${column} VALUES (?)
    `).run(channelId.toString(), cb);
  }

  insertDiscordUpdateChannel(args, cb) {
    this._insertDiscordChannel(args, "UpdateChannels", cb);
  }

  insertDiscordEventChannel(args, cb) {
    this._insertDiscordChannel(args, "EventChannels", cb);
  }

  getLastBoot(cb) {
    this.db.get(`
      SELECT unixtime FROM ServerBoot
      ORDER BY unixtime DESC
      LIMIT 1
      `, cb);
  }

  getPlayerChangeSinceLastBoot(cb) {
    this.getLastBoot(
      (error, row) => {
        if(error || !(row?.unixtime)) {
          return;
        }
        this.db.all(`
          SELECT * FROM PlayerCountChange 
          WHERE PlayerCountChange.unixtime >= ?
          `, row.unixtime, (error, row) => {
            if(error) cb(error, row);
            cb(error, row.map(({action, ...other}) => {
              return {isJoin: action==='join',...other}
            }));
          })
      });
  }

  getDiscordMedia({limit=10, from=0}, cb) {
    this.db.all(`
      SELECT url FROM DiscordMedia
      ORDER BY unixtime DESC
      LIMIT $limit OFFSET $from
    `, [
      limit,
      from
    ],cb);
    
  }

  _getDiscordChannels(column, cb) {
    if (column !== "UpdateChannels" && column !== "EventChannels")
      throw new Error("incorrect column name");
    this.db.all(`
      SELECT * FROM ${column}
    `, cb);
  }

  getDiscordUpdateChannels(cb) {
    this._getDiscordChannels("UpdateChannels", cb);
  }

  getDiscordEventChannels(cb) {
    this._getDiscordChannels("EventChannels", cb);
  }
}
