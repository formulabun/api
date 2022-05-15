import {readFile} from "fs";
import _ from "lodash";

function matchMap(map, search) {
  const searchParams = search.split(" ");

  const matches = searchParams.map(term => {
    const searchTerm = new RegExp(_.escapeRegExp(term), "i");
    if (map.fullname?.match(searchTerm)) return true;
    if (map.mappack?.match(searchTerm)) return true;
    if (("map" + map.mapid).match(searchTerm)) return true;
    return false;
  })
  return matches.filter(b => !b).length == 0;
}


function readMapsFile(cb) {
  readFile("public/maps.json", {encoding:"UTF-8"}, (err, data) => {
    if (err) cb(err, null);
    cb(null, JSON.parse(data));
  });
}

export default (app) => {

  app.get("/servers/:server/maps", function (req, res, next) {
    const mapQuery = req.query.id;
    if(!mapQuery) return next();

    let mapParam = mapQuery.toLowerCase();
    if( mapParam.substr(0,3) === "map")
      mapParam = mapParam.substr(3);

    readMapsFile((err, data) => {
      let map = data.filter(e => e.mapid.toLowerCase() === mapParam);
      if(map.length !== 1)
        return res.status(404).send(`Couldn't find map ${mapParam}`);
      res.json(map[0]);
    });
  });

  app.get("/servers/:server/maps", function (req, res, next) {
    let searchQuery = req.query.search;
    if(!searchQuery) return next();
    searchQuery = searchQuery.toLowerCase();

    readMapsFile((err, data) => {
      res.json(data.filter(map => matchMap(map, searchQuery)));
    });
  });

  app.get("/servers/:server/maps", function (req, res) {
    readMapsFile((err, data) => {
      res.json(data);
    });
  });
}
