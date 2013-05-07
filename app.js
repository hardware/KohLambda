/**
 * Dépendances
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  
  , routes  = require('./routes')
  , session = require('./routes/session')
  , user    = require('./routes/user')
  , casting = require('./routes/casting');

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

app.get('/', routes.loginredirect);
app.get('/login', routes.loginredirect); // Connexion temporaire
app.post('/login', user.login);
app.get('/error/:error', routes.error);
app.get('/help', routes.help);

/*
 *  ROUTES : Le casting
 */
app.get('/casting', casting.index);
app.get('/casting/check', casting.check);
app.get('/casting/register', casting.register);
app.get('/casting/waiting', casting.waiting);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
