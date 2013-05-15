var pg = require('pg')
  , http = require('http')
  , xml2js = require('xml2js')
  , gameModel = require('../models/game')
  , userModel = require('../models/user')
  , cityModel = require('../models/city');

// Fonction pour récupérer les informations sur le jeu et sur l'utilisateur (et sa ville).
exports.settings = function(req, res, options, callback) {

  if(!!options.shouldBeLogged && !req.session.user) {
    res.redirect('/login');
    return;
  }

  exports.gameSettings(req, res, options, function(gameSettings) {
    exports.userSettings(req, res, options, function(userSettings) {
      exports.citySettings(req, res, options, function(citySettings) {
        var settings = {  path:               req.path,
                          title:              "KohLambda - ",
                          councilStartHour:   19,
                          councilEndHour:     24,  //End always greater than start
                          challengeStartHour: 1,
                          challengeEndHour:   19,  //End always greater than start
                          inscriptionDays:    2
                        };
        settings.game = gameSettings;
        settings.city = citySettings;
        settings.user = userSettings;
        
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
    var data = {  userId: req.session.user.key,
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
  //Expires all sessions
  if(req.session.game) req.session.game.sessioncached = 0;
  if(req.session.user) req.session.user.sessioncached = 0;
  if(req.session.city) req.session.city.sessioncached = 0;
  
  if(req.session.user && req.session.user.key) {
    exports.getXML(req, res, req.session.user.key, function(hordes) {
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
            res.redirect('/error/notingame');
            break;
          case 'maintain':
            res.redirect('/error/maintain');
            break;
          default:
            res.redirect('/error/'+result.hordes.error.$.code);
        }
      } else {

        var userData = {
          id:       req.session.user.id,
          //  name:     hordes.owner.citizen.$.name,   // -> Avec l'accès sécurisé
          updated:  new Date()
        };
        
        var cityData = {
          id:     hordes.headers.game.$.id,
          name:   hordes.data.city.$.city,
          day:    hordes.headers.game.$.days
        };
        
        var findUserCityData = {
          userId: req.session.user.key,
          season: req.session.game.season
        }
        
        userModel.updateUser(userData, function() {
          cityModel.findUserCity(findUserCityData, function(citySettings) {
            if(citySettings) {
              cityModel.updateCity(cityData, function() {
                res.redirect('/');
              });
            } else {
              cityData.id_user = req.session.user.id;
              cityData.user_key = req.session.user.key;
              cityData.season = req.session.game.season;
              
              cityModel.addCity(cityData, function() {
                res.redirect('/');
              });
            }
          });
        });
      }
    });
  } else {
    res.redirect('/login');
  }
  

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

  // Si la requête est trop longue => timeout !
  httpReq.on('socket', function(socket) {
    socket.setTimeout(5000);
    socket.on('timeout', function() {
      httpReq.abort();
      res.redirect('/error/xmltimeout');
    });
  });

  // Si une erreur survient
  httpReq.on('error', function(err) {
    httpReq.abort();
    res.redirect('/error/xmlunavailable');
  });

}

var is_expired = function(datetime) {
  var expiration = 1000*60*60; //1h
  return (new Date()).getTime() > datetime + expiration;
}