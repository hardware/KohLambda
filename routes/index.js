var session = require('./session');

/*
 *  Page d'aide du jeu
 *  Route : /help
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.help = function(req, res) {
	session.infos(req, res, true, function(settings) {
		settings.title += "Aide";
		res.render('help', settings);
  });
};

/*
 *  Page d'erreur générale. Retourne une erreur en fonction du paramètre dans l'URL
 *  Route : /error/:error
 *  Accès : public
 *  Method : GET
 */
exports.error = function(req, res) {
	session.infos(req, res, false, function(settings) {
		settings.title += "Erreur";
		settings.error = req.params.error;
		res.render('error', settings);
	});
};

/*
 *  Page vers la page de connexion temporaire
 *  Route : /login
 *  Accès : public
 *  Method : GET
 */
exports.loginredirect = function(req, res) {
	session.infos(req, res, false, function(settings) {
		settings.title += "Connexion temporaire";
		res.render('login', settings);
	});
};
