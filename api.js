import dotenv from 'dotenv';
import express from 'express';
import getSrb2Info from 'srb2kartinfoparse';
const app = express();

const {
  api_port,
  kart_ip,
  kart_port,
  kart_maps_url,
} = dotenv.config().parsed;

app.get('/', (req, res) => {
  res.redirect("/main");
});

app.get("/:server", (req, res) => {
  res.json({
    links: [
      {players: `./players`},
      {server: `./server`},
      {maps: `./maps`}
    ]
  });
});

app.get("/:server/players", function (req, res) {
  getSrb2Info(kart_ip, kart_port, () => {},
    function(data) {
      res.json(data)},
    function(error) {
      res.status(500).json(error)
    });
});

app.get("/:server/server", function (req, res) {
  getSrb2Info(kart_ip, kart_port,
    function(data) {
      res.json(data)},
    () => {},
    function(error) {
      res.status(500).json(error)
    });
});

app.get("/:server/maps", function (req, res) {
  res.redirect(kart_maps_url);
});

export default () => {
  app.listen(api_port, () => {
    console.log(`express api started on ${api_port}`);
  });
}
