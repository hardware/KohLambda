var async = require('async')
  , data = require('./data')
  , tribe = require('./tribe')
  , council = require('./council')
  , challenge  = require('./challenge')
  , userModel  = require('../models/user')
  , tribeModel = require('../models/tribe')
  , gameModel  = require('../models/game');

exports.switchToCouncil = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    data.settings(req, res, {}, function(settings) {

      async.series([
        // ETAPE 1 : Validation des morts sur hordes
        function(callback) {
          if(settings.gameStage == 'CASTING' || settings.gameStage == 'STARTED')
            validateHordes(req, res, callback);
          else
            callback();
        },
        // ETAPE 2 : Validation des épreuves
        function(callback) {
          if(settings.gameStage == 'STARTED')
            challenge.validateChallenges(req, res, callback);
          else
            callback();
        }
      ],
      function(err, results) {
        if(!err) res.send('switchToCouncil DONE !');
      });

    });
  });
}

exports.switchToChallenges = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    data.gameSettings(req, res, {}, function(settings) {

      async.series([
        // ETAPE 1 : Validation des morts sur hordes
        function(callback) {
          if(settings.gameStage == 'CASTING' || settings.gameStage == 'STARTED')
            validateHordes(req, res, callback);
          else
            callback();
        },
        // ETAPE 2 : Partage des équipes (Si les inscriptions sont finies)
        function(callback) {
          if(settings.game.day == 2)
            tribe.split(req, res, settings.game.season, callback);
          else
            callback();
        },
        // ETAPE 3 : Validation du conseil
        function(callback) {
          if(settings.gameStage == 'STARTED')
            council.validateCouncil(req, res, callback);
          else
            callback();
        },
        // ETAPE 4 : Réunification des équipes (Si nbUsers < SEUIL A ETABLIR)
        function(callback) {
          // IF (nbUsers < ?)
            tribe.reunification(req, res, callback);
          // else
            callback();
        },
        // ETAPE 5 : Selection de l'épreuve
        function(callback) {
          if(settings.gameStage == 'STARTED')
            challenge.selectChallenge(req, res, callback);
          else
            callback();
        }
      ],
      function(err, results) {
        if(!err) res.send('switchToChallenges DONE !');
      });

    });
  });
}

var validateHordes = function(req, res, updateDay, callback) {

  if(updateDay)
    gameModel.updateGameDay();
  // Vérification des joueurs morts

}

var checkSecureKey = function(req, res, secureKey, callback) {

  if(secureKey === 'A DEFINIR')
    callback();
  else
    res.send('invalid_key');

}

/*
                ####### Heroku scheduler #######

           COMMAND            FREQUENCY              HOUR
---------------------------------------------------------------------
| cron --task to-council    |   daily   |   18:00 UTC (19:00 CET)   |
| cron --task to-challenges |   daily   |   00:00 UTC (01:00 CET)   |
---------------------------------------------------------------------
                                                Heure d'hiver [UTC+1]

           COMMAND            FREQUENCY              HOUR
---------------------------------------------------------------------
| cron --task to-council    |   daily   |   17:00 UTC (19:00 CEST)  |
| cron --task to-challenges |   daily   |   23:00 UTC (01:00 CEST)  |
---------------------------------------------------------------------
                                                  Heure d'été [UTC+2]

Note :
 - pour la commande cron voir le fichier bin/cron
 - pour paramétrer le scheduler : heroku addons:open scheduler
*/