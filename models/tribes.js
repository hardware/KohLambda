var pg = require('pg');

exports.addUserInTribe = function(data) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    client.query('INSERT INTO tribes(tribe, season, status, death_day, death_type, id_user) VALUES ($1, $2, default, default, default, $3)',
    [data.tribe, data.season, data.userId], function(err, result) {

      client.query('UPDATE public.users SET inTribe = $1 WHERE id = $2',
      [true, data.userId], function(err, result) {
        done();
      });

    });

  });

}
