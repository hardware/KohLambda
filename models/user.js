var pg = require('pg');

exports.findUserByKey = function(userKey, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM public.users WHERE key = $1 LIMIT 1', [userKey], function(err, result) {
      done();
      if(result.rowCount == 1) {
        callback(result.rows[0]);
        console.dir(result.rows[0]);
      } else
        callback(null);
    });
  });

}

exports.findUsersByType = function(userType, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT name FROM public.users WHERE type = $1', [userType], function(err, result) {
      done();
      callback(result);
    });
  });

}

/*
  Ajoute un utilisateur dans la BDD

  Retourne le dernier identifiant généré par le champ id
  auto-incrémenté de type SERIAL (nextval)
*/
exports.addUser = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO users(name, key) VALUES ($1, $2) RETURNING id',
    [data.name, data.key], function(err, result) {
      done();
      callback(result);
    });
  });

}

exports.updateUserType = function(data, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('UPDATE public.users SET type = $1 WHERE id = $2',
    [data.userType, data.userId], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });
  });

}

exports.updateUser = function(data, callback) {
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
    client.query('UPDATE public.users SET ' + set + ' WHERE id = $1',
    values, function(err, result) {
      done();
      console.log('user updated');
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });
  });

}