var pg = require('pg');
var http = require('http');
var xml2js = require('xml2js');

/*
 *  Récupération des infos du jeu (saison, jour, status des inscriptions)
 *  Si shouldBeLogged est égal à TRUE, la fonction vérifie si l'utilisateur est connecté
 */
exports.infos = function(req, res, shouldBeLogged, callback) {

	console.log(req.session);

	var settings = {
		"path":req.path,
		"title":"KohLambda - ",
		"game":{
			"season":0,
			"day":0,
			"enrollment":null
		},
		"city":{},
		"user":{}
	};

	if(req.session.user) { settings.user =  req.session.user}
	if(req.session.city) { settings.city =  req.session.city}

	// On vérifie que l'utilisateur soit bien connecté
	if(shouldBeLogged && !req.session.user) {
		res.redirect('/');
		return;
	} else {

		// Si les informations du jeu ne sont pas dans la session
		if(!req.session.game) {
			pg.connect(process.env.DATABASE_URL, function(err, client, done) {

				// Récupération des infos du jeu
		    client.query('SELECT * FROM public.game', function(err, result) {
		    	// On ajoute les infos du jeu à la session
					req.session.game = result.rows[0];
					settings.game = req.session.game;
					callback(settings);
					done();
		  	});

		  });

		} else {
			settings.game = req.session.game;
			callback(settings);
		}

	}

};

/*
 * Récupération des infos du XML dans la fonction callback
 * 'result.hordes' correspond à la représentation JSON du XML de Hordes.
 */
exports.getXML = function(req, res, callback) {

	// On vérifie si l'utlisateur est connecté
	if(!req.session.user) {
		res.redirect('/');
	} else {

		var buffer = '';
		var key = req.session.user.key;
		var parser = new xml2js.Parser({explicitArray: false});
		var options = {
		  hostname: 'www.hordes.fr',
		  port: 80,
		  path: '/xml/?k='+key
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
	          // Switch sur les possibles erreurs de hordes
	          switch(result.hordes.error.$.code) {
			        case 'user_not_found':
			          req.session = null; // Suppression de la clé invalide
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