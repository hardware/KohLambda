var async = require('async');

exports.immunity = function(req, res) {
  //TODO: Afficher l'épreuve d'immunité
}

exports.reward = function(req, res) {
  //TODO: Afficher l'épreuve de confort
}

exports.selectChallenge = function(req, res, callback) {
  //TODO: Selectionner l'épreuve de la journée
}

var immunityValidation = function(req, res) {
  //TODO: Valider l'épreuve d'immunité
}

var rewardValidation = function(req, res, callback) {
  //TODO: Valider l'épreuve de confort
}

var validateChallenges = function(req, res, callback) {

  immunityValidation(req, res, function() {
    if(checkChallengeDay())
      rewardValidation(req, res, callback);
    else
      callback();
  });

}

var checkChallengeDay = function(req, res, currentDay) {

  if( (currentDay > 0) && (currentDay % 2 == 0) )
    return true;
  else
    return false;

}