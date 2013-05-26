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
        if(req.session.user.type == 'leader') {
          console.log("==> Notingame mais leader, on continue");
          callback();
        } else
          res.redirect('/error/notingame');
        break;
      case 'maintain':
        res.redirect('/error/maintain');
        break;
      default:
        res.redirect('/error/'+result.hordes.error.$.code);
    }

  } else {

    console.log("==> Pas d'erreur dans le flux");
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
    tribe:null
  };

  if(req.session.user.type == 'leader') {
    console.log("==> Le joueur est un leader !");
    // On vérifie si il est mort
    if(1 == 0) { // à la place de 1 : hordes.owner.citizen.$.dead avec le xml sécurisé
      console.log("==> Le joueur est mort, donc il est eliminé");
      status.user.eliminated = true;
      status.tribe.status    = 'dead';
      status.tribe.death_day = req.session.game.day;
      console.log(status);
      callback(status);

    } else {
      console.log("==> Le joueur n'est pas mort");
      // On vérifie qu'il soit toujours dans la même ville
      var findUserCityData = {
        userId: req.session.user.id,
        season: req.session.game.season
      }

      cityModel.findUserCity(findUserCityData, function(cityInfos) {

        if(cityInfos.id != status.city.id) {
          console.log("==> Le joueur n'est pas dans la même ville, donc éliminé");
          status.user.eliminated = true;
          status.tribe.status    = 'dead';
          status.tribe.death_day = req.session.game.day;
          console.log(status);
          callback(status);

        } else {
          console.log("==> Le joueur est dans la même ville");
          // On vérifie qu'il ne soit pas banni
          if(0 == 1) { // à la place de 0 : hordes.owner.citizen.$.ban avec XML sécurisé
            console.log("==> Le joueur est banni, donc il est éliminé");
            status.user.eliminated = true;
            status.tribe.status    = 'banished';
            status.tribe.death_day = req.session.game.day;
            console.log(status);
            callback(status);

          } else {
            console.log("==> Le joueur n'est pas banni");
            callback(status);
            console.log(status);
          }

        }

      });

    }

  } else {
    console.log("==> le joueur n'est pas un leader, on ne check pas son statut");
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
        console.log("==> Mise à jour du statut du joueur dans la tribu");
        console.log(status);
        tribeModel.updateTribe(status.tribe, function() {
          callback();
        });

      } else {
        console.log("==> Le joueur n'a pas encore de tribu");
        callback();
      }

    });

  } else {
    console.log("==> Le joueur n'est pas un leader donc pas de maj de tribu");
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
      console.log("==> Mise à jour des infos de la ville");
      cityModel.updateCity(status.city, function() {
        callback();
      });

    } else {
      console.log("==> Nouvelle ville, ajout à la BDD");
      status.city.id_user = req.session.user.id;
      status.city.season  = req.session.game.season;

      cityModel.addCity(status.city, function() {
        callback();
      });

    }

  });

}