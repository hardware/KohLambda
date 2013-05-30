var cityModel = require('../models/city');
var tribeModel = require('../models/tribe');

exports.checkHordesStatus = function(req, res, hordes, callback) {

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
        if(req.session.user.type == 'leader')
          callback();
        else
          res.redirect('/error/notingame');
        break;
      case 'maintain':
        res.redirect('/error/maintain');
        break;
      default:
        res.redirect('/error/'+result.hordes.error.$.code);
    }

  } else {

    callback();

  }

}

exports.checkUserStatus = function(req, res, hordes, callback) {

  var status = {
    user: {
      id:  req.session.user.id,
      key: req.session.user.key,
      updated: new Date()
    },
    city: {
      id:   hordes.headers.game.$.id,
      name: hordes.data.city.$.city,
      day:  hordes.headers.game.$.days
    },
    tribe:{}
  };

  if(req.session.user.type == 'leader') {

    // On vérifie si il est mort
    if(1 == 0) { // à la place de 1 : hordes.owner.citizen.$.dead avec le xml sécurisé

      status.user.eliminated = true;
      status.tribe.status    = 'dead';
      status.tribe.death_day = req.session.game.day;

      callback(status);

    } else {

      // On vérifie qu'il soit toujours dans la même ville
      var findUserCityData = {
        userId: req.session.user.id,
        season: req.session.game.season
      }

      cityModel.findUserCity(findUserCityData, function(cityInfos) {

        if(cityInfos.id != status.city.id) {

          status.user.eliminated = true;
          status.tribe.status    = 'dead';
          status.tribe.death_day = req.session.game.day;

          callback(status);

        } else {

          // On vérifie qu'il ne soit pas banni
          if(0 == 1) { // à la place de 0 : hordes.owner.citizen.$.ban avec XML sécurisé

            status.user.eliminated = true;
            status.tribe.status    = 'banished';
            status.tribe.death_day = req.session.game.day;

            callback(status);

          } else {

            callback(status);

          }

        }

      });

    }

  } else {

    callback(status);

  }

}

exports.updateUserTribe = function(req, res, status, callback) {

  if(req.session.user.type == 'leader') {
    var findUserTribeData = {
      userId: req.session.user.id,
      season: req.session.game.season
    }

    tribeModel.findUserTribe(findUserTribeData, function(result) {

      if(result) {

        tribeModel.updateTribe(status.tribe, function() {
          callback();
        });

      } else {

        callback();
      }

    });

  } else {

    callback();

  }

}

exports.updateUserCity = function(req, res, status, callback) {

  var findUserCityData = {
    userId: req.session.user.id,
    season: req.session.game.season
  }

  cityModel.findUserCity(findUserCityData, function(cityInfos) {

    if(cityInfos) {

      cityModel.updateCity(status.city, function() {
        callback();
      });

    } else {

      status.city.id_user = req.session.user.id;
      status.city.season  = req.session.game.season;

      cityModel.addCity(status.city, function() {
        callback();
      });

    }

  });

}