var pg = require('pg');
var http = require('http');
var xml2js = require('xml2js');
var settingsModel = require('../models/settings');

// Fonction pour récupérer les informations sur le jeu et sur l'utilisateur (et sa ville).
exports.settings = function(req, res, options, callback) {

  if(options.shouldBeLogged && !req.session.user) {
    res.redirect('/login');
    return;
  }

  exports.gameSettings(req, res, options, function(gameSettings) {
    exports.citySettings(req, res, options, function(citySettings) {
      exports.userSettings(req, res, options, function(userSettings) {
        callback(mergeObjects(gameSettings, citySettings, userSettings));
      });
    });
  });

}

exports.gameSettings = function(req, res, options, callback) {

  var gameSettings = {"path":req.path, "title":"KohLambda - "};

  if(req.session.game) {
    gameSettings.game = req.session.game;
    callback(gameSettings);
  } else {
    settingsModel.getGameSettings(function(gameParams) {
      req.session.game = gameParams;
      gameSettings.game = req.session.game;
      callback(gameSettings);
    });
  }

}

exports.citySettings = function(req, res, options, callback) {

  var citySettings = {"city":{}};

  if(req.session.city) {
    citySettings.city = req.session.city;
  }

  callback(citySettings);

}

exports.userSettings = function(req, res, options, callback) {

  var userSettings = {"user":{}};

  if(req.session.user) {
    userSettings.user = req.session.user;
  }

  callback(userSettings);

}

exports.update = function(req, res, userkey, callback) {

  exports.getXML(req, res, userkey, function(hordes) {
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
      // req.session.user.name = hordes.owner.citizen.$.name -> Avec l'accès sécurisé

      req.session.city = {
        "name": hordes.data.city.$.city,
        "day": hordes.headers.game.$.days,
        "id": hordes.headers.game.$.id
      };

      callback();
    }
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

var mergeObjects = function(obj1, obj2, obj3){
  var obj = {};
  for (var attr in obj1) { obj[attr] = obj1[attr]; }
  for (var attr in obj2) { obj[attr] = obj2[attr]; }
  for (var attr in obj3) { obj[attr] = obj3[attr]; }
  return obj;
}