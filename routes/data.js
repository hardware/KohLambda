var pg = require('pg');

// Fonction pour récupérer les informations sur le jeu et sur l'utilisateur (et sa ville).
exports.settings = function(req, res, options, callback) {
  if(!!options.shouldBeLogged && !req.session.user) {
    res.redirect('/login');
    return;
  }
  
  exports.gameSettings(req, res, options, function(gameSettings) {
    options.game = gameSettings;
    exports.userSettings(req, res, options, function(userSettings) {
      callback(gameSettings + userSettings); // Concatenate objects.
    });
  });
}

exports.gameSettings = function(req, res, options, callback) {
  if(req.session.game) callback(req.session.game);
  else db.gameSettings(callback);
}

exports.userSettings = function(req, res, options, callback) {
  if(req.session.user) callback(req.session.user);
  else db.userSettings(callback);
}

exports.update = function(req, res) {
  session.getXML(req, res, function(hordes) {
    if(hordes.error) {
      // Switch sur les possibles erreurs de hordes concernant la ville.
      switch(hordes.error.$.code) {
        case 'user_not_found':
          // Suppression de la session utilisateur
          req.session.user = null;
          res.redirect('/error/usernotfound');
          break;
        case 'horde_attacking':
          res.redirect('/error/attack');
          break;
        case 'not_in_game':
          res.redirect('/error/notingame');
          break;
        case 'maintain':
          res.redirect('/error/maintain');
          break;
        default:
          res.redirect('/error/'+result.hordes.error.$.code);
      }
    } else {    
      req.session.user = {
        name:   hordes.data.city.$.city,
        key:    hordes.headers.game.$.days
      };
      db.upsert('user', req.session.user, ['key']);
      
      req.session.city = {
        name:   hordes.data.city.$.city,
        day:    hordes.headers.game.$.days,
        id:     hordes.headers.game.$.id
      };
      db.upsert('city', req.session.city, ['id']);
      
      // Redirect to home.
      res.redirect('/');
    }
  });
}

exports.getXML = function(req, res) {
	// On vérifie si l'utilisateur est connecté
	if(!req.session.user) {
		res.redirect('/');
	} else {

		var buffer = '';
		var key = req.session.user.key;
		var parser = new xml2js.Parser({explicitArray: false});
		var options = {
		  hostname: 'www.hordes.fr',
		  port: 80,
		  path: '/xml/?k='+key // TODO : ajouter la clé sécurisée (sk)
		};

		http.get(options, function(httpRes) {

			// Réception des blocs de données puis concaténation des chunks dans un buffer
			// Voir Chunked transfer encoding
		  httpRes.on('data', function (chunk) {
		    buffer += chunk;
		  });

		  httpRes.on('end', function() {
		  	parser.parseString(buffer, function(err, result) {
		  		if(result) {
            callback(result.hordes);
	        } else {
            // Suppression de la session utilisateur
            req.session.user = null;
            
            if(result.hordes.error && result.hordes.error.$.code == 'user_not_found') {
              res.redirect('/error/usernotfound');
            } else {
              res.redirect('/error/xmlunavailable');
            }
	        }

		  	});
		  });

		});

	}

}