var pg = require('pg');
var session = require('./session');

exports.index = function(req, res) {
	session.infos(req, res, true, function(settings) {

		if(req.session.user.type != null) {
			res.redirect('/casting/waiting');
			return;
		} else if (!req.session.city) {
			res.redirect('/casting/check');
			return;
		} else {
			settings.title += "Casting";
			settings.city = req.session.city;
			res.render('casting', settings);
		}

  });
};

exports.check = function(req, res) {
	session.infos(req, res, true, function(settings) {

		if(req.session.user.type != null) {
			res.redirect('/casting/waiting');
			return;
		}

		session.getXML(req, res, function(hordes) {
			settings.title += "Casting";
			settings.city = {
				"name": hordes.data.city.$.city,
        "day": hordes.headers.game.$.days,
        "id": hordes.headers.game.$.id
			};

			// Vérification de l'existence de la ville
			pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		    client.query('SELECT u.name FROM public.cities c JOIN public.users u on c.user_key = u.key WHERE c.id = $1 AND c.season = $2',
		    	[parseInt(settings.city.id), req.session.game.season], function(err, result) {

		    	if(result.rowCount == 1) {
		    		// Ville déjà enregistrée
		    		settings.city.registered = true;
		    		settings.city.leader = result.rows[0].name;
		    	} else {
		    		// Ville non enregistrée
		    		settings.city.registered = false;
		    	}

		    	done();
					req.session.city = settings.city;
					res.redirect('/casting');
		  	});
		  });

		});
  });
};

exports.register = function(req, res) {
	session.infos(req, res, true, function(settings) {

		if(req.session.user.type != null) {
			res.redirect('/casting/waiting');
			return;
		}

		var leader = req.session.city && req.session.city.day == 1 && !req.session.city.registered;
		var helper = req.session.city && req.session.city.day == 1 && req.session.city.registered;

		if(leader) {

			pg.connect(process.env.DATABASE_URL, function(err, client, done) {
				// La ville n'existe pas donc on l'ajoute
		    client.query('INSERT INTO cities(id, name, season, day, user_key, id_user) VALUES ($1, $2, $3, $4, $5, $6)',
		    	[
			    	parseInt(req.session.city.id),
			    	req.session.city.name,
			    	req.session.game.season,
			    	req.session.city.day,
			    	req.session.user.key,
			    	req.session.user.id
		    	], function(err, result) {

		    	if(result.rowCount == 1) {
		    		// Mise à jour du status du joueur
		    		client.query('UPDATE public.users SET type = $1 WHERE id = $2',
		    			['leader', req.session.user.id], function(err, result) {
		    				done();
		    				req.session.user.type = 'leader';
		    				res.redirect('/casting/waiting');
		    		});
		    	}
		  	});
		  });

		} else if(helper) {

			pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		    client.query('UPDATE public.users SET type = $1 WHERE id = $2',
	    		['helper', req.session.user.id], function(err, result) {
		    		done();
		    		req.session.user.type = 'helper';
		    		res.redirect('/casting/waiting');
	    	});
	    });

		} else {
			res.redirect('/error/cantregister');
		}

	});
};

exports.waiting = function(req, res) {
	session.infos(req, res, true, function(settings) {

		pg.connect(process.env.DATABASE_URL, function(err, client, done) {
	    client.query('SELECT name FROM public.users WHERE type = $1', ['leader'], function(err, result) {
			  settings.adventurers = result.rows;
			  console.log(settings.adventurers);
	    	done();
	    	res.render('waiting', settings);
	  	});
	  });

	});
};