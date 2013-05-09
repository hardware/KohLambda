var pg = require('pg');

exports.findRegisteredCity = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT u.name FROM public.cities c JOIN public.users u on c.user_key = u.key WHERE c.id = $1 AND c.season = $2',
    [data.cityId, data.season], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });
  });

}

exports.addCity = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO cities(id, name, season, day, user_key, id_user) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      data.cityId,
      data.cityName,
      data.season,
      data.cityDay,
      data.userKey,
      data.userId
    ], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });
  });

}