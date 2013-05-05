var pg = require('pg');
var session = require('./session');

/*
 *  Authentification de l'utilisateur via l'annuaire (méthode POST)
 */
exports.login = function(req, res){
	if(req.body.key) {
		req.session.user = {"key":req.body.key};

		// Vérification de l'existence de l'utilisateur
		pg.connect(process.env.DATABASE_URL, function(err, client, done) {
			// Récupération du profil du joueur
	    client.query('SELECT * FROM public.users WHERE key = $1', [req.body.key], function(err, result) {

	    	if(result.rowCount == 1) {
	    		req.session.user = result.rows[0];
	    		if(req.session.user.type != null) {
	    			res.redirect('/casting/waiting');
	    		} else {
	    			res.redirect('/casting/check');
	    		}
	    	} else {
	    		// L'utilisateur n'existe pas, on l'enregistre
	    		register(req, res, client);
	    	}

				done();
	  	});
	  });

	} else {
		res.redirect('/login');
	}
};

/*
 * Enregistrement de l'utilisateur
 */
var register = function(req, res, client) {

	var name = '';
	// var name = hordes.owner.citizen.$.name; // Avec l'accès sécurisé

	switch(req.session.user.key) {
    case '5e03e132efe39d02b4004307f8d32d22':
      name = 'Liezon'; break;
    case '4febc3b627fa9e99c265241c55321969':
      name = 'Hardware'; break;
    case 'b1ae32bdd1918bb0d9d6d18bf3997b41':
      name = 'Diaruga'; break;
    case '645deaa1125cc32c74ef933d40583c7b':
      name = '-HS-'; break;
    case '3415d4626e785daa057d9f1a2ebc3602':
      name = 'MarbteK'; break;
    case '807d08cf5273903d665e2d49dc5f4603':
      name = 'Gabriel1996'; break;
    case 'b2fea25b870305cce136e4c016b9b516':
      name = 'Lurtz'; break;
    case '47b8a26cf01e5ddd6ae18c04a1720633':
      name = 'Ormax'; break;
    case '814445f57ee35d730c82609062a4f5de':
      name = 'Derenlof'; break;
    case 'e8786bb22b76b021e51e592f7a223879':
      name = 'inkredible'; break;
    case 'e3dda2b196001dcbf11b38607729e943':
      name = 'Ariablue'; break;
    case 'ab5caf9b46136e5fb01f1e9d38f22e6b':
      name = 'Walutin'; break;
    case '14b35448864afe6f6d901c56308b4e30':
      name = 'AngeSombre'; break;
    case '7e32d264f06a25cc12b82b5f9cbc123e':
      name = 'Lucent'; break;
    case '54b2ab68041e4e6838675a7a1a7dcb44':
      name = 'Thahatos'; break;
    case '37a99621c15274068f02aaf45aed1d2f':
      name = 'Scrib'; break;
    case '42a8da7cb1ab7dfc88274c71e00c3b7d':
      name = 'Chacalex'; break;
    default:
      name = '[anonyme]';
  }

  if(name == '[anonyme]') {
    req.session = null;
    res.send('Vous n\'êtes pas invité à cette beta :(');
    return;
  }

	client.query('INSERT INTO users(name, key) VALUES ($1, $2) RETURNING id',
		[name, req.session.user.key], function(err, result) {
			req.session.user.id = result.rows[0].id;
			req.session.user.name = name;
			res.redirect('/casting/check');
	});

};

/*
 *  MAJ de la ville
 */
exports.update = function(req, res, callback) {

  session.getXML(req, res, function(hordes) {
    var cityInfos = {};
    cityInfos.city = {
      "name": hordes.data.city.$.city,
      "day": hordes.headers.game.$.days,
      "id": hordes.headers.game.$.id
    };
    callback(cityInfos);
  });

};

/*
 *  Fonction utilitaire pour créer des query et peupler une table (si l'enregistrement existe, il est mis à jour sinon il est inséré)
 */

/*
var populate = function(client, table, fields, where, callback) {
  var query = 'UPDATE public."'+table+'" SET ';
  var afields = new Array();
  var avalues = new Array();
  var index = 1;
  for(field in fields) {
    var value = fields[field];
    if(index > 1) query += ', ';
    query += field + ' = $' + index;
    avalues.push(value);
    afields.push(field);
    index++;
  }

  var index2 = 1;
  query += ' WHERE '
  for(field in where) {
    var value = where[field];
    if(index2 > 1) query += ' AND ';
    query += '"' + table + '".' + field + ' = $' + index;
    avalues.push(value);
    afields.push(field);
    index++;
    index2++;
  }

  client.query(query,
    avalues, function(err, result) {
    if(result.rowCount == 0) {
      var query = 'INSERT INTO public."'+table+'" (';
      var index = 1;
      for(fx in afields) {
        if(index > 1) query += ', ';
        query += '"' + afields[fx] + '"';
        index++;
      }

      var index2 = 1;
      query += ') VALUES ('
      for(value in avalues) {
        if(index2 > 1) query += ', ';
        query += '$' + index2;
        index2++;
      }
      query +=')';

      client.query(query, avalues);
    }

    callback();
  });
};
*/