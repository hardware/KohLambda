var pg = require('pg');
var data = require('./data');
var cityModel = require('../models/city');
var userModel = require('../models/user');

/*
 *  Page de casting
 *  Route : /casting
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.index = function(req, res) {

	data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
		checkSession(req, res, function() {
			settings.title += "Casting";
			res.render('casting', settings);
		});
	});

}

/*
 *  Page de vérification des conditions d'inscription
 *  Route : /casting/check
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.check = function(req, res) {

	data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
		checkSession(req, res, function() {
			data.update(req, res, req.session.user.key, function() {
				var data = {"cityId":req.session.city.id, "season":req.session.game.season};

				cityModel.findRegisteredCity(data, function(result) {

					if(result) {
						// Ville déjà enregistrée
		    		req.session.city.registered = true;
		    		req.session.city.leader = result.rows[0].name;
					} else {
						// Ville non enregistrée
				    req.session.city.registered = false;
					}

					res.redirect('/casting');

				});
			});
		});
	});

}

/*
 *  Page permettant d'inscrire l'utilisateur afin qu'il puisse accéder à l'aventure
 *  Route : /casting/register
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.register = function(req, res) {

	data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
		checkSession(req, res, function() {

			// /!\ [ A MODIFIER ] Pendant la beta : Jour > 0 / Hors beta : Jour == 1
			var leader = req.session.city.day > 0 && !req.session.city.registered;
			var helper = req.session.city.day > 0 && req.session.city.registered;

			if(leader) {

				var cityData = {
					"cityId": 	req.session.city.id,
		      "cityName": req.session.city.name,
		      "season": 	req.session.game.season,
		      "cityDay": 	req.session.city.day,
		      "userKey": 	req.session.user.key,
		      "userId": 	req.session.user.id
				};

				// La ville n'existe pas donc on l'ajoute dans la BDD
				cityModel.addCity(cityData, function(result) {

					var userData = {"userType":"leader", "userId":req.session.user.id};

					// Mise à jour du statut du joueur (leader)
					userModel.updateUserType(userData, function(result) {
						req.session.user.type = 'leader';
		      	res.redirect('/casting/waiting');
					});
				});

			} else if(helper) {

				var userData = {"userType":"helper", "userId":req.session.user.id};

				// Mise à jour du statut du joueur (helper)
				userModel.updateUserType(userData, function(result) {
					req.session.user.type = 'helper';
	      	res.redirect('/casting/waiting');
				});

			} else {

				res.redirect('/error/cantregister');
				return;

			}

		});
	});

}

/*
 *  Page d'attente avant la création des équipes
 *  Route : /casting/waiting
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.waiting = function(req, res) {

	data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
		if(req.session.user.type == null) {
			res.redirect('/casting');
			return;
		}

		userModel.findUsersByType('leader', function(result) {
			settings.leaders = result.rows;
			userModel.findUsersByType('helper', function(result) {
				settings.helpers = result.rows;
				settings.title += "Salle d'attente";
				res.render('waiting', settings);
			});
		});

	});

}

var checkSession = function(req, res, callback) {

	if(req.session.user.type != null) {
		res.redirect('/casting/waiting');
		return;
	} else if(!req.session.city) {
		res.redirect('/error/nocityinfo');
		return;
	} else {
		callback();
	}

}