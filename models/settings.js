var pg = require('pg');

exports.getGameSettings = function(callback) {

  var gameSettings = {};

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM public.game', function(err, result) {
      done();
      gameSettings = result.rows[0];
      callback(gameSettings);
    });
  });

}