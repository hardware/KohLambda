var pg = require('pg');
var data = require('./data');

exports.switchToCouncil = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    data.settings(req, res, {}, function(gameSettings) {
      var currentHour = new Date().getHours();
      var whenInscriptions = gameSettings.day >= 0 && gameSettings.day < gameSettings.inscriptionDays;
      var whenJustStarted = gameSettings.day = gameSettings.inscriptionDays;
      var whenStarted = gameSettings.game.day >= gameSettings.inscriptionDays;

      if(whenInscriptions || whenStarted) exports.validateHordes(req, res);

      if(whenStarted) {
        exports.validateImmunity(req, res);
        exports.validateReward(req, res);
      }

      res.send('ok');
    });
  });
}

exports.switchToChallenges = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    data.gameSettings(req, res, {}, function(settings) {
      var currentHour = new Date().getHours();
      var whenInscriptions = settings.game.day >= 0 && settings.game.day < settings.inscriptionDays;
      var whenJustStarted = settings.game.day = settings.inscriptionDays;
      var whenStarted = settings.game.day >= settings.inscriptionDays;

      if(whenInscriptions || whenStarted) exports.validateHordes(req, res);

      if(whenJustStarted) exports.splitTribes(req, res);

      if(whenStarted) exports.validateCouncil(req, res);

    });
  });
}

exports.splitTribes = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    //TODO: Faire le split des équipes
    res.send("split_ok");
  });
}

exports.validateImmunity = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    //TODO: Valider l'épreuve d'immunité
  });
}

exports.validateReward = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    //TODO: Valider l'épreuve de confort
  });
}

exports.validateCouncil = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    //TODO: Valider les votes du conseil
    //TODO: Changer de jour
  });
}

exports.validateHordes = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    //TODO: Valider les morts et statuts sur Hordes
    //TODO: Vérifier que le joueur est toujours dans la même ville
  });
}

var checkSecureKey = function(req, res, secureKey, callback) {
  if(secureKey === 'yjppWBJ5r7AmMLARPwkcb') callback();
  else res.send('invalid_key')
}