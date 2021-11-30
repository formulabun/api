import { extractSoc } from 'srb2kartinfoparse/pk3parse.js';
import parseSocFile from 'srb2kartinfoparse/socparse.js';
import fetch from 'node-fetch';
import os from 'os';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const pathname = path.resolve(os.homedir(), 'mods', 'index');
const isMapPack = (name) => /^[A-Z]*R[A-Z]*.*\.pk3$/i.test(name);
const isSocFile = (name) => /.soc$/i.test(name);
const isFormulabunFile = (name) => /^k_formulabun_v.*\.pk3$/i.test(name);
const nameToPath = (name) => `${pathname}${path.sep}${name}`

const kart_hostname = "formulabun.club"
const outfile = path.resolve(os.homedir(), 'files', 'maps.json');

async function downloadFiles() {
  const filecachedir = fs.mkdirSync(pathname, {recursive:true});
  const repo = await fetch(`http://www.${kart_hostname}/repo`).then(res => res.json())
  return Promise.all(
    repo.map(o =>
      o.name
    ).filter(n =>
      isMapPack(n) || isFormulabunFile(n)
    ).map(name => 
      new Promise(async (accept, reject) => {
        try {
          fs.accessSync(nameToPath(name)); // throws error when file does not exist
          accept(name);
        } catch (e){
          const fileS = fs.createWriteStream(nameToPath(name));
          await fetch(`http://www.${kart_hostname}/repo/${name}`)
            .then(res => 
              res.body
            ).then(body =>
              body.pipe(fileS)
            ).then((fs) =>
              accept(name)
            );
        }
      })));
}

async function saveJSON(json) {
  fs.writeFile(outfile, JSON.stringify(json), console.error)
}


async function update() {
  function loadSocFile(file, soc) {
    const kartfile = file.replace("soc", "kart")
    try {
      fs.accessSync('./socs/'+file);
      const content = fs.readFileSync('./socs/'+file, 'utf-8');
      soc = parseSocFile(kartfile, content, soc);
    } catch {
      console.log(`Please copy the soc from inside ${kartfile} to socs/${file}`)
      soc.pending = true;
    }
    return soc;
  }

  const filenames = await downloadFiles();
  var soc = {}
  soc.pending = false;
  soc = loadSocFile('maps.soc', soc)
  soc = loadSocFile('patch.soc', soc)

  for(const file of filenames.filter(isMapPack)) {
    try {
      soc = await extractSoc(nameToPath(file), soc);
    } catch (e) {
      console.log("Feel free to ignore previous error message. Fetching large files takes a while but only has to be done once");
      soc.pending = true;
    }
  }
  const fbunFile = filenames.map(p => path.basename(p)).filter(isFormulabunFile)[0]; 
  try {
    soc = await extractSoc(nameToPath(fbunFile), soc);
  } catch(e) {
      console.log("Feel free to ignore previous error message. Fetching large files takes a while but only has to be done once");
      soc.pending = true;
  }

  soc.state = undefined;
  soc.object = undefined;

  const content = _.sortBy(Object.keys(soc.level).map(key => {
    soc.level[key].mapid = key;
    return soc.level[key];
  }).map(o => {
      o.hidden = o.hidden || false;
      return o
  }).filter(o => o.typeoflevel.toLowerCase() !== 'singleplayer'), ["mapid"]);

  saveJSON(content);
}

update();
