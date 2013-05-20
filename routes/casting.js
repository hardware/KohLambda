var pg = require('pg')
  , data = require('./data')
  , cityModel = require('../models/city')
  , userModel = require('../models/user');

/*
 *  Page de casting
 *  Route : /studio/casting
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.index = function(req, res) {

  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    checkCityRegistration(req, res, function() {
      settings.title += "Casting";
      res.render('casting', settings);
    })
  });

}

/*
 *  Page permettant d'inscrire l'utilisateur afin qu'il puisse accéder à l'aventure
 *  Route : /studio/casting/apply
 *  Accès : L'utilisateur doit être connecté
 *  Method : POST
 */
exports.apply = function(req, res) {

  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    checkCityRegistration(req, res, function() {
      // /!\ [ A MODIFIER ] Pendant la beta : Jour > 0 / Hors beta : Jour == 1
      var leader = req.session.city.day > 0 && !req.session.city.registered;
      var helper = req.session.city.day > 0 && req.session.city.registered;

      if(leader) {
        var userData = {userType: "leader", userId:req.session.user.id};

        // Mise à jour du statut du joueur (leader)
        userModel.updateUserType(userData, function(result) {
          req.session.user.type = 'leader';
          var cityData = {id:req.session.city.id, registered:true};
          cityModel.updateCity(cityData, function() {
            req.session.city.registered = true;
            res.redirect('/studio/casting/approved');
          });
        });
      } else if(helper) {
        var userData = {userType:"helper", userId:req.session.user.id};

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
 *  Route : /studio/casting/approved
 *  Accès : L'utilisateur doit être connecté et être un leader
 *  Method : GET
 */
exports.approved = function(req, res) {

  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    if(req.session.user.type != 'leader') {
      res.redirect('/studio/casting');
      return;
    }

    userModel.findUsersByType('leader', function(result) {
      settings.leaders = result.rows;
      settings.title += "Salle d'attente";
      res.render('waiting', settings);
    });

  });

}

/*
 *  Les joueurs inscrits mais ne participant pas à l'aventure sont redirigés vers cette page
 *  Route : /studio/casting/rejected
 *  Accès : L'utilisateur doit être connecté et être un helper
 *  Method : GET
 */
exports.rejected = function(req, res) {

  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    if(req.session.user.type != 'helper') {
      res.redirect('/studio/casting');
      return;
    }

    userModel.findUsersByType('helper', function(result) {
      settings.helpers = result.rows;
      settings.title += "Salle d'attente";
      res.render('waiting', settings);
    });
  });

}

var checkSession = function(req, res, callback) {

  if(req.session.user.type != null) {
    if(req.session.user.type == 'leader') res.redirect('/studio/casting/approved');
    else res.redirect('/studio/casting/rejected');
  } else {
    callback();
  }

}

var checkCityRegistration = function(req, res, callback) {
  checkSession(req, res, function() {

    var data = {cityId:req.session.city.id, season:req.session.game.season};

    cityModel.findRegisteredCity(data, function(result) {
      if(result) {
        req.session.city.registered = true;
        req.session.city.leader = result.name;
      } else {
        req.session.city.registered = false;
      }
      callback();
    });
  });
}