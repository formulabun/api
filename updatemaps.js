#!/usr/bin/node
import {openFile, parseSocFile} from "srb2kartjs";
import fetch from 'node-fetch';
import os from 'os';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import dotenv from 'dotenv';

//const pathname = path.resolve(os.homedir(), 'mods', 'index');
const pathname = path.resolve(os.homedir(), '.cache', 'formulabun-web', 'soc');
const isMapPack = (name) => /^[A-Z]*R[A-Z]*.*\.pk3$/i.test(name) || /.*\.kart$/.test(name);
const isSocFile = (name) => /.soc$/i.test(name);
const isFormulabunFile = (name) => /^k_formulabun_v.*\.pk3$/i.test(name);
const nameToPath = (name) => `${pathname}${path.sep}${name}`

const {
  socs_path,
  host
} = dotenv.config().parsed;

const kart_hostname = "formulabun.club"
const outfile = path.resolve(os.homedir(), 'repos', 'formulabun', 'api', 'public', 'maps.json');
const publicDir = path.resolve(os.homedir(), 'repos', 'formulabun', 'api', 'public');

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
    const filepath = `${socs_path}/${file}`
    try {
      fs.accessSync(filepath);
      const content = fs.readFileSync(filepath, 'utf-8');
      soc = parseSocFile(kartfile, content, soc);
    } catch {
      console.log(`Please copy the soc from inside ${kartfile} to ${filepath}`)
      soc.pending = true;
    }
    return soc;
  }

  async function saveMapThumbnails(file) {
    await file.setBaseFile(`${socs_path}/srb2.srb`);
    const socs = await file.getAllSocs();
    const dir = file.getDirectory();
    for (let level in socs.level) {
      if(socs.level.hasOwnProperty(level)) {
        const imagename = `MAP${level.toUpperCase()}P`;
        const imageRegEx = new RegExp(`${imagename}.*$`);
        const foundDir = dir.search(imageRegEx);
        const imageSavePath = path.join(publicDir, "imgs/", `${imagename}.png`);
        try {
          if(level == 'vj') throw new Error("Fuck this shit of overwriting stuff I hate it.");
          fs.accessSync(imageSavePath);
        } catch {
          let stream;
          if(foundDir.length == 1) {
            stream = await file.getImage(foundDir[0].fullpath);
          } else {
            const path = dir.search(/graphics/i)[0].allFiles().filter(p => imageRegEx.test(p))[0];
            if (path) stream = await file.getImage(path);
            else throw new Error('something went wrong with ', dir.search(/graphics?/i)[0].search(/MAP..P.*/));
          }
          if(!stream) throw new Error(`could not create png stream for image ${imagename}`);
          const filestream = fs.createWriteStream(imageSavePath);
          stream.pipe(filestream);
        }
      }
    }
  }

  const filenames = await downloadFiles();
  var soc = {}
  soc.pending = false;

  try {
    fs.accessSync(`${socs_path}/maps.kart`);
    fs.accessSync(`${socs_path}/patch.kart`);
    fs.copyFileSync(`${socs_path}/maps.kart`, nameToPath("maps.kart"));
    fs.copyFileSync(`${socs_path}/patch.kart`, nameToPath("patch.kart"));
    filenames.push("maps.kart", "patch.kart");
  } catch {
    console.log(`Please copy the maps.kart and patch.kart files to ${socs_path}`)
  }

  for(const file of filenames.filter(isMapPack)) {
    try {
      const modfile = await openFile(nameToPath(file));
      const filesoc = await modfile.getAllSocs();
      await saveMapThumbnails(modfile);
      _.merge(soc, filesoc); // ;-;
    } catch (e) {
      console.log("Feel free to ignore previous error message. Fetching large files takes a while but only has to be done once");
      soc.pending = true;
    }
  }

  const fbunFile = filenames.map(p => path.basename(p)).filter(isFormulabunFile)[0]; 
  try {
    const bunfile = await openFile(nameToPath(fbunFile));
    const bunsoc = await bunfile.getAllSocs();
    for(let level in bunsoc.level) {
      if(bunsoc.level.hasOwnProperty(level)) {
        delete bunsoc.level[level].mappack;
      }
    }
    _.merge(soc, bunsoc);
  } catch(e) {
    console.log(e);
    console.log("Feel free to ignore previous error message. Fetching large files takes a while but only has to be done once");
    soc.pending = true;
  }

  soc.state = undefined;
  soc.object = undefined;

  const content = _.sortBy(Object.keys(soc.level).map(key => {
    soc.level[key].mapid = key;
    soc.level[key].thumbnail = `http://${host}/servers/main/static/imgs/MAP${key.toUpperCase()}P.png`;
    return soc.level[key];
  }).map(o => {
    o.hidden = o.hidden || false;
    return o
  }), ["mapid"]);

  saveJSON(content);
}

update();
