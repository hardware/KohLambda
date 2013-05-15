var pg = require('pg');
var data = require('./data');

exports.switchToCouncil = function(req, res) {
  //TODO: Vérifier l'authentification du cron req.params.securekey
  //Vérifier que si la clé sécurisée est "dev" et que la personne est admin, elle puisse valider.
  
  data.gameSettings(req, res, {}, function(settings) {  
    var currentHour = new Date().getHours();
    var whenInscriptions = settings.game.day >= 0 && settings.game.day < settings.inscriptionDays;
    var whenJustStarted = settings.game.day = settings.inscriptionDays;
    var whenStarted = settings.game.day >= settings.inscriptionDays;
    
    if(whenInscriptions || whenStarted) exports.validateHordes(req, res);
    
    if(whenStarted) {
      exports.validateImmunity(req, res);
      exports.validateReward(req, res);
    }
    
  });
}

exports.switchToChallenges = function(req, res) {
  //TODO: Vérifier l'authentification du cron req.params.securekey
  //Vérifier que si la clé sécurisée est "dev" et que la personne est admin, elle puisse valider.
  
  data.gameSettings(req, res, {}, function(settings) {  
    var currentHour = new Date().getHours();
    var whenInscriptions = settings.game.day >= 0 && settings.game.day < settings.inscriptionDays;
    var whenJustStarted = settings.game.day = settings.inscriptionDays;
    var whenStarted = settings.game.day >= settings.inscriptionDays;
    
    if(whenInscriptions || whenStarted) exports.validateHordes(req, res);
    
    if(whenJustStarted) exports.splitTribes(req, res);
    
    if(whenStarted) exports.validateCouncil(req, res);
    
  });
}

exports.splitTribes = function(req, res) {
  //TODO: Diviser les joueurs en deux équipes
}

exports.validateImmunity = function(req, res) {
  //TODO: Valider l'épreuve d'immunité
}

exports.validateReward = function(req, res) {
  //TODO: Valider l'épreuve de confort
}

exports.validateCouncil = function(req, res) {
  //TODO: Valider les votes du conseil
  //TODO: Changer de jour
}

exports.validateHordes = function(req, res) {
  //TODO: Valider les morts et statuts sur Hordes
  //TODO: Vérifier que le joueur est toujours dans la même ville
}