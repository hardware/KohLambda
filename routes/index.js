var data = require('./data');

/*
 *  Page d'accueil
 *  Route : /
 *  Accès : L'utilisateur doit être connecté
 *  Method : GET
 */
exports.index = function(req, res) {
  //TODO: Afficher la page d'accueil
  data.settings(req, res, {shouldBeLogged:true}, function(settings) {
    if(settings.gameStage == 'CASTING') {

      res.redirect('/studio/casting');

    } else if(settings.gameStage == 'STARTED') {

      if(session.user.tribe != null) res.redirect('/tribe/'+session.user.tribe); // Joueur > Redirection vers la tribu
      else res.redirect('/challenge/immunity'); // Visiteur > Redirection vers l'épreuve d'immunité

    } else if(settings.gameStage == 'STOPPED') {

      if(settings.game.day > -10)      settings.title += "Tenez vous prêts !";
      else if(settings.game.day > -30) settings.title += "Bientôt...";
      else if(settings.game.day > -60) settings.title += "Prochainement";
      else                             settings.title += "Repassez plus tard";

      res.render('notstarted', settings);
    }
  });
}

/*
 *  Page d'erreur générale. Retourne une erreur en fonction du paramètre dans l'URL
 *  Route : /error/:error
 *  Accès : public
 *  Method : GET
 */
exports.error = function(req, res) {
  data.settings(req, res, {shouldBeLogged:false}, function(settings) {
    settings.title += "Erreur";
    settings.error = req.params.error;
    res.render('error', settings);
  });
}

/*
 *  Page vers la page de connexion temporaire
 *  Route : /login
 *  Accès : public
 *  Method : GET
 */
exports.loginredirect = function(req, res) {
  data.settings(req, res, {"shouldBeLogged":false}, function(settings) {
    settings.title += "Connexion temporaire";
    res.render('login', settings);
  });
}
