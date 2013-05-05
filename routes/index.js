var session = require('./session');

exports.help = function(req, res) {
	session.infos(req, res, true, function(settings) {
		settings.title += "Aide";
		res.render('help', settings);
  });
};

exports.error = function(req, res) {
	session.infos(req, res, false, function(settings) {
		settings.title += "Erreur";
		settings.error = req.params.error;
		res.render('error', settings);
	});
};

exports.loginredirect = function(req, res) {
	session.infos(req, res, false, function(settings) {
		settings.title += "Connexion temporaire";
		res.render('login', settings);
	});
};

/*
exports.switchto = function(req, res) {
  var client = new pg.Client(process.env.DATABASE_URL);
  client.connect(function(err) {
    var query;
    var time = req.params.time;
    if(time == 'day') // validate night;
      query = client.query('UPDATE game SET time=\'day\', day=day+1 WHERE true');
    else
      query = client.query('UPDATE game SET time=\'night\' WHERE true');

    query.on('end', function() {
      res.redirect('/');
    });
  });
};
*/