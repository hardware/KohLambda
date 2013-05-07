var pg = require('pg');
var session = require('./session');

/*
 *  Page de casting
 *  Route : /casting
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.index = function(req, res) {
	session.infos(req, res, true, function(settings) {

    /*
      Si l'utilisateur est déjà inscrit et validé (son statut a été défini)
        -> On le redirige vers la page d'attente
      Sinon on affiche la page de casting
    */
    
		if(req.session.user.type != null) {
			res.redirect('/casting/waiting'); // TODO : une fois l'aventure démarrée l'utilisateur doit être redirigé vers la page du jeu
			return;
		} else {
			settings.title += "Casting";
			res.render('casting', settings);
		}

  });
};

/*
 *  Page de vérification des conditions d'inscription
 *  Route : /casting/check
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.check = function(req, res) {
	session.infos(req, res, true, function(settings) {

    /*
      Si l'utilisateur est déjà inscrit et validé (son statut a été défini)
        -> On le redirige vers la page d'attente
    */
		if(req.session.user.type != null) {
			res.redirect('/casting/waiting');
			return;
		}

    // TODO : Remplacer cette partie en utilisant user.update()
    
    // #######################################################
		session.getXML(req, res, function(hordes) {
			settings.title += "Casting";
			settings.city = {
				"name": hordes.data.city.$.city,
        "day": hordes.headers.game.$.days,
        "id": hordes.headers.game.$.id
			};
    // #######################################################
    
			pg.connect(process.env.DATABASE_URL, function(err, client, done) {
			
			  /*
			    Vérification de l'existence de la ville (check de l'id et de la saison)
			    Jointure permettant de récupérer en même temps le nom du leader
			    qui a inscrit la ville en premier
			  */
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
		    	
		    	// On met à jour les données de la session
					req.session.city = settings.city;
					res.redirect('/casting');
		  	});
		  });
		});
  });
};

/*
 *  Page permettant d'inscrire l'utilisateur afin qu'il puisse accéder à l'aventure
 *  Route : /casting/register
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.register = function(req, res) {
	session.infos(req, res, true, function(settings) {

    /*
      Si l'utilisateur est déjà inscrit et validé (son statut a été défini)
        -> On le redirige vers la page d'attente
    */
		if(req.session.user.type != null) {
			res.redirect('/casting/waiting');
			return;
		}

		// /!\ [ A MODIFIER ] Pendant la beta : Jour > 0 / Hors beta : Jour == 1
		var leader = req.session.city && req.session.city.day > 0 && !req.session.city.registered;
		var helper = req.session.city && req.session.city.day > 0 && req.session.city.registered;

    // Si le joueur est le premier de sa ville à s'inscrire
		if(leader) {

			pg.connect(process.env.DATABASE_URL, function(err, client, done) {
				// La ville n'existe pas donc on l'ajoute dans la BDD
		    client.query('INSERT INTO cities(id, name, season, day, user_key, id_user) VALUES ($1, $2, $3, $4, $5, $6)',
		    	[
			    	parseInt(req.session.city.id), // la fonction parseInt() est peut-être pas nécessaire, à regarder...
			    	req.session.city.name,
			    	req.session.game.season,
			    	req.session.city.day,
			    	req.session.user.key,
			    	req.session.user.id
		    	], function(err, result) {

		    	if(result.rowCount == 1) {
		    		// Mise à jour du statut du joueur (leader)
		    		client.query('UPDATE public.users SET type = $1 WHERE id = $2',
		    			['leader', req.session.user.id], function(err, result) {
		    				done();
		    				req.session.user.type = 'leader';
		    				res.redirect('/casting/waiting');
		    		});
		    	}
		  	});
		  });

    // Si le joueur n'est pas le premier de sa ville à s'inscrire
		} else if(helper) {

			pg.connect(process.env.DATABASE_URL, function(err, client, done) {
			  // Mise à jour du statut du joueur (helper)
		    client.query('UPDATE public.users SET type = $1 WHERE id = $2',
	    		['helper', req.session.user.id], function(err, result) {
		    		done();
		    		req.session.user.type = 'helper';
		    		res.redirect('/casting/waiting');
	    	});
	    });

    // Les conditions ne sont pas valides
		} else {
			res.redirect('/error/cantregister');
			return;
		}

	});
};

/*
 *  Page d'attente avant la création des équipes
 *  Route : /casting/waiting
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.waiting = function(req, res) {
	session.infos(req, res, true, function(settings) {

    /*
      Si l'utilisateur n'est pas inscrit (son statut n'a pas été défini)
        -> On le redirige vers la page de casting
    */
		if(req.session.user.type == null) {
			res.redirect('/casting');
			return;
		}

		pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		
		  /*
	      Récupération de la liste joueurs inscrits
			*/
	    client.query('SELECT name FROM public.users WHERE type = $1', ['leader'], function(err, result) {
	    	settings.leaders = result.rows;
	    	client.query('SELECT name FROM public.users WHERE type = $1', ['helper'], function(err, result) {
	    		settings.helpers = result.rows;
			  	settings.title += "Salle d'attente";
			  	done();
	    		res.render('waiting', settings);
	    	});
	  	});
	  });

	});
};
