var data = require('./data');

exports.help = function(req, res) {
  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    settings.title += "Aide";
    res.render('help', settings);
  });
}

exports.faq = function(req, res) {
  data.settings(req, res, {"shouldBeLogged":true}, function(settings) {
    settings.title += "FAQ";
    res.render('faq', settings);
  });
}