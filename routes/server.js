import express from 'express';
const router = express.Router();

router.use(function(req, res, next) {
  next()
});

router.get("/", (req, res, next) => {
  res.body = {response:"welcome to server route"};
  next();
});

export { router };
