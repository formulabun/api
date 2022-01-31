import {expect} from 'chai';

import startDiscord from '../discord_api.js';
import {gifEmbedFilter} from '../discord_api.js';

var client, channel;
const test_channel = "937656293362135050"

async function getMessage(id) {
  if (!channel) return false;
  return (await channel.messages.cache.get(id));
}

describe("discord", function() {
  before( function(done) {
    client = startDiscord();
    client.on('ready', function () {
      client.channels.fetch(test_channel).then(function(c) {
        channel = c
        channel.messages.fetch().then(function() {
          done()
        });
      });
    });
  });

  after(function(done) {
    client.destroy();
    done();
  })

  describe('extract message', function () {
    describe("#gifEmbedFilter", function() {
      it("works when it's supposed to", function (done) {
        getMessage("937656873912504330").then(gifEmbedFilter).then((content) => {
          const url = "https://cdn.discordapp.com/attachments/937656293362135050/937656873673441320/kart0008.gif";
          expect(content).to.be.ok;
          expect(content).to.be.lengthOf(1);
          expect(content[0] === url).to.be.true;
          done();
        });
      });

      it("works for multiple embeds", function(done) {
        getMessage("937666346366423041").then(gifEmbedFilter).then((content) => {
          const url1 = "https://cdn.discordapp.com/attachments/937656293362135050/937666345108135956/kart0006.gif";
          const url2 = "https://cdn.discordapp.com/attachments/937656293362135050/937666345884069888/kart0020.gif";
          expect(content).to.be.ok;
          expect(content).to.be.lengthOf(2);
          expect(content[0] === url1).to.be.true;
          expect(content[1] === url2).to.be.true;
          done();
        })
      });

      it("gives nothing when there is nothing", function(done) {
        getMessage("937665283651411998").then(gifEmbedFilter).then((content) => {
          expect(content).to.be.lengthOf(0);
          done();
        });
      });

    });
  });
});
