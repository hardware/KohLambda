var pg = require('pg');

exports.findUserByKey = function(userKey, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM public.users WHERE key = $1', [userKey], function(err, result) {
      done();
      if(result.rowCount == 1)
        callback(result);
      else
        callback(null);
    });
  });

}

exports.findUsersByType = function(userType, callback) {

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT id, name FROM public.users WHERE type = $1', [userType], function(err, result) {
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
    [data.userName, data.userKey], function(err, result) {
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