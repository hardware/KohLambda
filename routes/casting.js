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
  //TODO: Afficher la page de présentation des conditions d'inscription.
  // Si candidat inscrit -> /studio/casting/approved

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
 *
exports.apply = function(req, res) {

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
  */
  
/*
 *  Page permettant d'inscrire l'utilisateur afin qu'il puisse accéder à l'aventure
 *  Route : /casting/apply
 *  Accès : L'utilisateur doit être connecté
 *  Method : POST
 */
exports.apply = function(req, res) {

  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    checkSession(req, res, function() {

      // /!\ [ A MODIFIER ] Pendant la beta : Jour > 0 / Hors beta : Jour == 1
      var leader = req.session.city.day > 0 && !req.session.city.registered;
      var helper = req.session.city.day > 0 && req.session.city.registered;

      if(leader) {
        var userData = {userType: "leader",
                        userId:   req.session.user.id};

        // Mise à jour du statut du joueur (leader)
        userModel.updateUserType(userData, function(result) {
          req.session.user.type = 'leader';
          res.redirect('/studio/casting/approved');
        });
      } else if(helper) {
        var userData = {"userType":"helper", "userId":req.session.user.id};

        // Mise à jour du statut du joueur (helper)
        userModel.updateUserType(userData, function(result) {
          req.session.user.type = 'helper';
          res.redirect('/studio/casting/rejected');
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
 *  Route : /casting/approved
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.approved = function(req, res) {

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

exports.rejected = function(req, res) {
  //TODO: afficher la page de rejet.
}

var checkSession = function(req, res, callback) {

  if(req.session.user.type != null) {
    res.redirect('/studio/casting/approved');
    return;
  } /*else if(!req.session.city) {
    res.redirect('/error/nocityinfo');
    return;
  } */else {
    callback();
  }

}