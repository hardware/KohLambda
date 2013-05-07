var pg = require('pg');
var http = require('http');
var xml2js = require('xml2js');
var user = require('./user');

/*
 *  Récupération des infos du jeu (saison, jour, status des inscriptions)
 *  Si shouldBeLogged est égal à TRUE, la fonction vérifie si l'utilisateur est connecté
 */
exports.infos = function(req, res, shouldBeLogged, callback) {

	// Vérou non actif par défaut
	var callbackLock = false;
	
	var settings = {
		"path":req.path, // Chemin de la requête
		"title":"KohLambda - ",
		"game":{
			"season":0,
			"day":0,
			"enrollment":null
		},
		// Objets vides (permet de ne pas avoir d'erreur lors de la génération du fichier layout.jade)
		"city":{},
		"user":{}
	};

  /*
    Si l'utilisateur est connecté
      -> On met à jour les paramètres utilisateur
  */
	if(req.session.user) {
		settings.user = req.session.user
		
		/*
    Si les informations de la ville ne sont pas présentes dans la session
      -> On bloque les callbacks suivants (sinon les infos de la ville ne seront pas retournées)
      -> On récupère les informations de la ville via la fonction user.update()
      -> On met à jour les infos de la session et les paramètres
    */
		if(!req.session.city) {
		
		  // Activation du vérou
			callbackLock = true;
			
			user.update(req, res, function(cityInfos) {
				req.session.city = cityInfos.city;
				settings.city = cityInfos.city;
				callback(settings);
			});
	  /*
    Si les informations de la ville sont présentes dans la session
      -> On met à jour les paramètres avec les infos de la session
    */
		} else {
			settings.city = req.session.city;
		}
	}

	/*
    Si l'utilisateur doit être connecté mais qu'il ne l'est pas
      -> On le redirige vers la page de connexion
  */
	if(shouldBeLogged && !req.session.user) {
		res.redirect('/login');
		return;
	} else {

		// Si les infos du jeu ne sont pas dans la session
		if(!req.session.game) {
			pg.connect(process.env.DATABASE_URL, function(err, client, done) {

				// Récupération des infos du jeu dans la BDD
		    client.query('SELECT * FROM public.game', function(err, result) {
		    	// On ajoute les infos du jeu à la session
					req.session.game = result.rows[0];
					settings.game = req.session.game;
					done();

					if(!callbackLock) { callback(settings); }
		  	});

		  });
		} else {
			settings.game = req.session.game;

			if(!callbackLock) { callback(settings); }
		}

	}

};

/*
 * Récupération des infos du XML dans la fonction callback
 * 'result.hordes' correspond à la représentation JSON du XML de Hordes.
 */
exports.getXML = function(req, res, callback) {

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

		  		if(!result || result.hordes.error) {
		  			// Suppression de la session utilisateur
		  			req.session.user = null;
	          // Switch sur les possibles erreurs de hordes
	          switch(result.hordes.error.$.code) {
			        case 'user_not_found':
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
	          callback(result.hordes);
	        }

		  	});
		  });

		});

	}

};
