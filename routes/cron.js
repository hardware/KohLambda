var pg = require('pg')
  , async = require('async')
  , data = require('./data');

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

exports.switchToCouncil = function(req, res) {
  checkSecureKey(req, res, req.body.secureKey, function() {
    data.settings(req, res, {}, function(settings) {
      var currentHour = new Date().getHours();

      async.series([
        // ETAPE 1 : Validation des morts sur hordes
        function(callback) {
          if(settings.gameStage == 'CASTING' || settings.gameStage == 'STARTED')
            exports.validateHordes(req, res);
          callback();
        },
        // ETAPE 2 : Validation des épreuves
        function(callback) {
          if(settings.gameStage == 'STARTED' && settings.challengeType == 'immunity')
            exports.validateImmunity(req, res);
          if(settings.gameStage == 'STARTED' && settings.challengeType == 'reward')
            exports.validateReward(req, res);
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
      var currentHour = new Date().getHours();

      async.series([
        // ETAPE 1 : Validation des morts sur hordes
        function(callback) {
          if(settings.gameStage == 'CASTING' || settings.gameStage == 'STARTED')
            exports.validateHordes(req, res);
          callback();
        },
        // ETAPE 2 : Partage des équipes (Si les inscriptions sont finies)
        function(callback) {
          if(settings.game.day == 2)
            exports.splitTribes(req, res);
          callback();
        },
        // ETAPE 3 : Validation du conseil
        function(callback) {
          if(settings.gameStage == 'STARTED')
            exports.validateCouncil(req, res);
          callback();
        },
        // ETAPE 4 : Réunification des équipes (Si nbUsers < SEUIL A ETABLIR)
        function(callback) {
          // IF (nbUsers < ?)
            exports.reunification(req, res);
          callback();
        },
        // ETAPE 5 : Selection de l'épreuve
        function(callback) {
          if(settings.gameStage == 'STARTED')
            exports.selectChallenge(req, res);
          callback();
        }
      ],
      function(err, results) {
        if(!err) res.send('switchToChallenges DONE !');
      });

    });
  });
}

exports.splitTribes = function(req, res) {
  //TODO: Faire le split des équipes
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

exports.selectChallenge = function(req, res) {
  //TODO: Selectionner l'épreuve de la journée
}

exports.reunification = function(req, res) {
  //TODO: Réunification des équipes
}

var checkSecureKey = function(req, res, secureKey, callback) {
  if(secureKey === 'A DEFINIR') callback();
  else res.send('invalid_key')
}