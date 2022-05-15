import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import {getSrb2Info} from 'srb2kartjs';
import Srb2KartDatabase from '../database/db.js';
import addMapRoutes from "./maps.js";

const app = express();
const db = new Srb2KartDatabase();

const {
  api_port,
  kart_ip,
  kart_port,
  host
} = dotenv.config().parsed;

function makeLinks(links, req) {
  const toFullPath = ([rel, link]) => {
    return {
      rel,
      url: `${req.protocol}://${host}${req.path}${req.path.endsWith('/')  ? '' : '/'}${link}`}
    };
  return links.map(toFullPath);
}

app.use(cors());
app.use('/servers/:server/static', express.static('public'))

app.get('/', (req, res) => {
  res.json({
    links: makeLinks([['servers', 'servers'], ['discord', 'discord']], req)
  });
});

app.get('/servers', (req, res) => {
  res.redirect("/servers/main");
});

app.get('/discord', (req, res) => {
  db.getDiscordMedia({}, (e, data) => {
    if(e) res.status(500).send("oops");
    res.json(data);
  })
});

app.get("/servers/:server", (req, res) => {
  makeLinks(['servers', 'discord'], req);
  res.json({
    links: makeLinks([['players', 'players'], ['server', 'server'], ['maps', 'maps']],req)
  });
});

app.get("/servers/:server/players", function (req, res) {
  getSrb2Info(kart_ip, kart_port, () => {},
    function(data) {
      res.json(data)},
    function(error) {
      res.status(500).json(error)
    });
});

app.get("/servers/:server/server", function (req, res) {
  getSrb2Info(kart_ip, kart_port,
    function(data) {
      res.json(data)},
    () => {},
    function(error) {
      res.status(500).json(error)
    });
});

addMapRoutes(app);

export default () => {
  app.listen(api_port, () => {
    console.log(`express api started on ${api_port}`);
  });
}
