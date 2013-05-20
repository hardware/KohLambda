var pg = require('pg');

exports.findRegisteredCity = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT u.name FROM public.cities c JOIN public.users u on c.id_user = u.id WHERE c.id = $1 AND c.season = $2 AND c.registered = $3 LIMIT 1',
    [data.cityId, data.season, true], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result.rows[0]);
      else
        callback(null);
    });
  });

}

exports.findUserCity = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM public.cities WHERE id_user = $1 AND season = $2 LIMIT 1',
    [data.userId, data.season], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result.rows[0]);
      else
        callback(null);
    });
  });

}

exports.addCity = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO cities(id, name, season, day, id_user) VALUES ($1, $2, $3, $4, $5)',
    [
      data.id,
      data.name,
      data.season,
      data.day,
      data.id_user
    ], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });
  });

}
exports.updateCity = function(data, callback) {
  var set = '';
  var values = [data.id];
  var i = 2;
  for(var field in data) {
    if(field != 'id') {
      if(i > 2) set += ', ';
      set += field + ' = $' + i;
      values[i-1] = data[field];
      i++;
    }
  }
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('UPDATE public.cities SET ' + set + ' WHERE id = $1',
    values, function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });
  });

}