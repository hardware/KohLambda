var pg = require('pg');

exports.getGame = function(callback) {

  var gameSettings = {};

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM public.game ORDER BY season DESC LIMIT 1', function(err, result) {
      done();
      callback(result.rows[0]);
    });
  });

}