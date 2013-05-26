var pg = require('pg');

exports.addUserInTribe = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    client.query('INSERT INTO tribes(tribe, season, status, death_day, death_type, id_user) VALUES ($1, $2, default, default, default, $3)',
    [data.tribe, data.season, data.id], function(err, result) {
      done();
      callback();
    });

  });

}

exports.findUserTribe = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    client.query('SELECT * FROM public.tribes WHERE id_user = $1 AND season = $2 LIMIT 1',
    [data.userId, data.season], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });

  });

}

exports.updateTribe = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {

    client.query('UPDATE public.tribes SET status = $1, death_day = $2',
      [data.status, data.death_day], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });

  });

}