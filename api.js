import express from 'express';
const app = express();
const port = 3030;

app.get('/', (req, res, next) => {
  res.body = {response: "hi there"};
  next();
});

// routers
import {router as playerRouter} from './routes/players.js';
import {router as serverRouter} from './routes/server.js';

const addRoute = (app, from, to, router) => {
  app.use(`/${to}`, router);
  app.use((req, res, next) => {
    const body = res.body;
    if(req.path !== from) return next();
    body[to] = `http://localhost:3030/${to}`;
    next();
  });
}

addRoute(app, '/', 'players', playerRouter);
addRoute(app, '/', 'server',  serverRouter);

app.use((req, res) => {
  res.json(res.body);
});

app.listen(port, () => {
  console.log(`express api started on ${port}`);
});
