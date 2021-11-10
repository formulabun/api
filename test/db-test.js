import {expect} from 'chai';
import Srb2KartDatabase from "../db.js";


describe("DB", function() {
  var db
  before(function(done) {
    db = new Srb2KartDatabase(":memory:", (e) => {
      if(e) console.error("error", e); done();
    })
  })

  beforeEach(function(done) {
    db.clear(done);
    /*db.close(() => {
      db = new Srb2KartDatabase(":memory:", done);
    });*/
  });
  
  describe('Table ServerBoot', function () {
    it('should not give error on correct input', function() {
      db.insertServerBoot({unixtime: Date.now()}, (error) => {
        expect(error).to.be.null
      })
    });

    it('should have data previously entered', function() {
      const utime = Date.now();
      db.insertServerBoot({unixtime:utime}, () => {
        db.getLastBoot((error, {unixtime}) => {
          expect(error).to.be.null;
          expect(unixtime).to.be.equal(utime);
        })
      });
    });

    it('should have the latest value', function () {
      const now = Date.now();
      const then = Date.now() + 1000;
      db.insertServerBoot({unixtime: now}, () => 
      db.insertServerBoot({unixtime: then}, () =>
        db.getLastBoot((error, {unixtime}) => {
          expect(unixtime).to.be.equal(then);
        })
      ));
    });
  });

  describe('Table PlayerCountChange', function() {
    const playerJoin = {
      isJoin: true,
      node: '1',
      ip: "192.0.0.1",
      port: "5029",
      unixtime: Date.now(),
    }
    it('should not give error on correct input', function() {
      db.insertPlayerCountChange(playerJoin, (e) => {expect(e).to.be.null});
    });
    it('should have data previously entered', function() {
      db.insertPlayerCountChange(playerJoin, () => {
        db.sqlite3database.get(`SELECT * FROM PlayerCountChange`, (e, row) => {
          expect(e).to.be.null;
          expect(row).to.deep.equal({
            action: 'join',
            node: playerJoin.node,
            ip: playerJoin.ip,
            port: playerJoin.port,
            unixtime: playerJoin.unixtime
          });
        })
      });
    });
  });

  describe('Table PlayerRename', function () {
    const playerRename = {
      oldName: 'old',
      newName: 'new',
      node: '1',
      ip: '172.0.0.1',
      port: '5029',
      unixtime: Date.now()
    }
    it('should not give error on correct input', function() {
      db.insertPlayerRename(playerRename, (e) => {
        expect(e).to.be.null
      });
    });

    it('should have data previously entered', function() {
      db.insertPlayerRename(playerRename, () => {
        db.sqlite3database.get(`
          SELECT * FROM PlayerRename
          `, (e, row) => {
            expect(e).to.be.null;
            expect(row).to.deep.equal(playerRename);
          });
      });
    });
  });

  describe("#getPlayerChangeSinceLastBoot", function() {
    const serverBoot = (index) => ({unixtime: Date.now() + index})
    const playerJoin = (index) => ({
      isJoin: true,
      node: `${index}`,
      ip: `192.0.0.${index}`,
      port: `${index + 5030}`,
      unixtime: Date.now() + index,
    })
    it('works for one join', function() {
      const p1 = playerJoin(1);
      db.insertServerBoot(serverBoot(1), () => {
        db.insertPlayerCountChange(p1, () => {
          db.getPlayerChangeSinceLastBoot((err, rows) => {
            expect(err).to.be.null
            expect(rows).to.have.lengthOf(1).to.deep.members([p1])
          })
        })
      })
    });

    it('works for two server boots', function() {
      const b1 = serverBoot(0);
      const p1 = playerJoin(1);
      const p2 = playerJoin(2);
      const b2 = serverBoot(3);
      const p3 = playerJoin(4);

      db.insertServerBoot(b1, () =>
      db.insertPlayerCountChange(p1, () =>
      db.insertPlayerCountChange(p2, () =>
      db.insertServerBoot(b2, () => 
      db.insertPlayerCountChange(p3, () => {
        db.getPlayerChangeSinceLastBoot((err, rows) => {
          expect(err).to.be.null;
          expect(rows).to.have.lengthOf(1).to.deep.members([p3]);
        });
      })))))

    })
  });

});
