/**
 * Dépendances
 */

var express = require('express')
  , http = require('http')
  , path = require('path')

  , routes  = require('./routes')
  , data = require('./routes/data')
  , account    = require('./routes/account')
  , casting = require('./routes/casting')
  , studio = require('./routes/studio')
  , tribe = require('./routes/tribe')
  , challenge = require('./routes/challenge')
  , council = require('./routes/council')
  , cron = require('./routes/cron');

var app = express();

// Paramètres de l'application
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('f6GLCNSWbqI73yjppWBJ5r7AmMLARPwkcbHw6PY3'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

process.env.DATABASE_URL = process.env.DATABASE_URL || "tcp://hardware:SagemD35c@localhost:5432/kohlambda";

// Paramètre de l'application dans l'environnement de développement
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*
 *  ROUTES
 */
app.get('/', routes.index);
app.get('/login', routes.loginredirect); // Connexion temporaire
app.get('/error/:error', routes.error);
app.get('/update', data.update);
app.post('/login', account.login);

/*
 *  ROUTES : Studios
 *
 *  Casting
 */
app.get('/studio/casting', casting.index);
app.get('/studio/casting/approved', casting.approved);
app.get('/studio/casting/rejected', casting.rejected);
app.get('/studio/casting/eliminated', casting.eliminated);
app.post('/studio/casting/apply', casting.apply);

/*
 *  ROUTES : Support
 */
app.get('/support/help', studio.help);
app.get('/support/faq', studio.faq);

/*
 *  ROUTES : Game
 */
app.get('/tribe/:tribe', tribe.details);
app.get('/tribe/:tribe/:user', tribe.userDetails);

app.get('/challenge/immunity', challenge.immunity);
app.get('/challenge/reward', challenge.reward);
//app.post('/challenge/immunity/validate', challenge.immunityValidation);
//app.post('/challenge/reward/validate', challenge.rewardValidation);

app.get('/council', council.index);
app.post('/council/vote', council.vote);

/*
 *  ROUTES : Cron
 */
app.post('/cron/to-council', cron.switchToCouncil);
app.post('/cron/to-challenges', cron.switchToChallenges);

// 404 Page
app.use(function(req, res, next){
  res.redirect('/error/404');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
