import {expect} from 'chai';

import startDiscord from '../discord_api.js';
import {getContentFromMessage} from '../discord_api.js';

var client, channel;
const test_channel = "937656293362135050"

async function getMessage(id) {
  if (!channel) return false;
  return (await channel.messages.cache.get(id));
}

describe("discord", function() {
  before( function(done) {
    this.timeout(3000);
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

  describe("#getContentFromMessage", function() {
    it("works for a single embed", function (done) {
      getMessage("937656873912504330").then(getContentFromMessage).then((content) => {
        const url = "https://cdn.discordapp.com/attachments/937656293362135050/937656873673441320/kart0008.gif";
        expect(content).to.be.ok;
        expect(content).to.be.lengthOf(1);
        expect(content[0] === url).to.be.true;
        done();
      }, done);
    });

    it("works for multiple embeds", function(done) {
      getMessage("937666346366423041").then(getContentFromMessage).then((content) => {
        const url1 = "https://cdn.discordapp.com/attachments/937656293362135050/937666345108135956/kart0006.gif";
        const url2 = "https://cdn.discordapp.com/attachments/937656293362135050/937666345884069888/kart0020.gif";
        expect(content).to.be.ok;
        expect(content).to.be.lengthOf(2);
        expect(content[0] === url1).to.be.true;
        expect(content[1] === url2).to.be.true;
        done();
      }, done)
    });

    it("gives nothing when there is nothing", function(done) {
      getMessage("937665283651411998").then(getContentFromMessage).then((content) => {
        expect(content).to.be.lengthOf(0);
        done();
      }, done);
    });

    it("works for one gfycat link", function(done) {
      getMessage("939287672978014318").then(getContentFromMessage).then((content) => {
        const url = "https://gfycat.com/waryfirstiberianlynx";
        expect(content).to.be.ok;
        expect(content).to.be.lengthOf(1);
        expect(content[0] === url).to.be.true;
        done();
      }, done);
    });

    it("works for two gfycat links", function(done) {
      getMessage("939472285541232660").then(getContentFromMessage).then((content) => {
        const url1 = "https://gfycat.com/livetalkativearmyant";
        const url2 = "https://gfycat.com/waryfirstiberianlynx";
        expect(content).to.be.ok;
        expect(content).to.be.lengthOf(2);
        expect(content[0] == url1).to.be.true;
        expect(content[1] == url2).to.be.true;
        done();
      }, done);
    });

    it("works for one cdn.discord link", function(done) {
      getMessage("939473321425260555").then(getContentFromMessage).then((content) => {
        const url = "https://cdn.discordapp.com/attachments/774046149177769986/907025915001864232/kart0667.gif";
        expect(content).to.be.ok;
        expect(content).to.be.lengthOf(1);
        expect(content[0] == url).to.be.true;
        done();
      }, done);
    });

    it("works for a mix of everything", function(done) {
      getMessage("939479776987598858").then(getContentFromMessage).then((content) => {
        const url1 = "https://cdn.discordapp.com/attachments/937656293362135050/939479777084063785/kart0008.gif";
        const url2 = "https://gfycat.com/waryfirstiberianlynx";
        const url3 = "https://cdn.discordapp.com/attachments/774046149177769986/907025915001864232/kart0667.gif"
        expect(content).to.be.ok;
        expect(content).to.be.lengthOf(3);
        expect(content[0] == url1).to.be.true;
        expect(content[1] == url2).to.be.true;
        expect(content[2] == url3).to.be.true;
        done();
      }, done);
    });
  });

});
