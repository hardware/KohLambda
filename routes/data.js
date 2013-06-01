var http       = require('http')
  , xml2js     = require('xml2js')
  , async      = require('async')
  , validation = require('./validation')
  , gameModel  = require('../models/game')
  , userModel  = require('../models/user')
  , cityModel  = require('../models/city');

// Fonction pour récupérer les informations sur le jeu et sur l'utilisateur (et sa ville).
exports.settings = function(req, res, options, callback) {

  if(!!options.shouldBeLogged && !req.session.user) {
    res.redirect('/login');
    return;
  }

  exports.gameSettings(req, res, options, function(gameSettings) {
    exports.userSettings(req, res, options, function(userSettings) {
      exports.citySettings(req, res, options, function(citySettings) {

        var settings = {
          path:               req.path,
          title:              "KohLambda - ",
          councilStartHour:   19,
          councilEndHour:     24,  //End always greater than start
          challengeStartHour: 1,
          challengeEndHour:   19,  //End always greater than start
          inscriptionDays:    2
        };

        settings.game = gameSettings;
        settings.user = userSettings;
        settings.city = citySettings;

        if(settings.game.day < 0)
          settings.gameStage = 'STOPPED';
        else if(settings.game.day >= 0 && settings.game.day < settings.inscriptionDays)
          settings.gameStage = 'CASTING';
        else if(settings.game.day >= settings.inscriptionDays)
          settings.gameStage = 'STARTED';

        callback(settings);
      });
    });
  });

}

exports.gameSettings = function(req, res, options, callback) {

  var gameSettings = 0;

  if(req.session.game && !is_expired(req.session.game.sessioncached)) {
    gameSettings = req.session.game;
    callback(gameSettings);
  } else {
    gameModel.getGame(function(game) {
      req.session.game = game;
      req.session.game.sessioncached = (new Date()).getTime();
      gameSettings = req.session.game;
      callback(gameSettings);
    });
  }

}

exports.citySettings = function(req, res, options, callback) {

  var citySettings = 0;

  if(req.session.city && !is_expired(req.session.city.sessioncached)) {
    citySettings = req.session.city;
    callback(citySettings);
  } else if(req.session.user && req.session.game) {
    var data = {  userId: req.session.user.id,
                  season: req.session.game.season   };
    cityModel.findUserCity(data, function(cityParams) {
      req.session.city = cityParams;
      if(req.session.city) {
        req.session.city.sessioncached = (new Date()).getTime();
        citySettings = req.session.city;
      }
      callback(citySettings);
    });
  } else {
    callback(citySettings);
  }
}

exports.userSettings = function(req, res, options, callback) {

  var userSettings = 0;

  if(req.session.user && !is_expired(req.session.user.sessioncached)) {
    userSettings = req.session.user;
    callback(userSettings);
  } else if(req.session.user && req.session.user.key) {
    userModel.findUserByKey(req.session.user.key, function(userParams) {
      req.session.user = userParams;
      req.session.user.sessioncached = (new Date()).getTime();
      userSettings = req.session.user;
      callback(userSettings);
    });
  } else {
    callback(userSettings);
  }

}

exports.update = function(req, res) {

  // Expiration des sessions
  if(req.session.game) req.session.game.sessioncached = 0;
  if(req.session.user) req.session.user.sessioncached = 0;
  if(req.session.city) req.session.city.sessioncached = 0;

  async.waterfall([

    // ETAPE 1 : Récupération du flux XML
    function(callback) {

      exports.getXML(req, res, req.session.user.key, function(hordes) {
        callback(null, hordes);
      });
    },

    // ETAPE 2 : Vérification du statut de hordes.fr
    function(hordes, callback) {
      validation.checkHordesStatus(req, res, hordes, function() {
        callback(null, hordes);
      });
    },

    // ETAPE 3 : Vérification du statut du joueur
    function(hordes, callback) {
      if(req.session.user.eliminated == true) {
        // Joueur déjà éliminé, on arrête le processus de mise à jour
        callback(true);
      } else {
        validation.checkUserStatus(req, res, hordes, function(status) {
          callback(null, status);
        });
      }
    },

    // ETAPE 4 : Mise à jour du joueur dans la bdd
    function(status, callback) {
      userModel.updateUser(status.user, function() {
        callback(null, status);
      });
    },

    // ETAPE 5 : Mise à jour du statut du joueur dans sa tribu
    function(status, callback) {
      validation.updateUserTribe(req, res, status, function() {
        callback(null, status);
      })
    },

    // ETAPE 6 : Mise à jour de la ville
    function(status, callback) {
      validation.updateUserCity(req, res, status, function() {
        callback(null);
      })
    }

  ], function (err, result) {

    res.redirect('/');

  });
}

exports.getXML = function(req, res, userKey, callback) {

  var buffer = '';
  var parser = new xml2js.Parser({explicitArray: false});
  var options = {
    hostname: 'www.hordes.fr',
    port: 80,
    path: '/xml/?k='+userKey // TODO : ajouter la clé sécurisée (sk)
  };

  var httpReq = http.get(options, function(httpRes) {
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
          res.redirect('/error/xmlunavailable');
        }
      });
    });
  });

}

var is_expired = function(datetime) {
  var expiration = 1000*60*60; // 1h en ms
  return (new Date()).getTime() > datetime + expiration;
}