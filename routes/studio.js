var data = require('./data');

exports.denis = function(req, res) {
  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    settings.title += "Aide";
    res.render('help', settings);
  });
}

exports.production = function(req, res) {
  //TODO: Afficher la FAQ.
}