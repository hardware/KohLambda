exports.details = function(req, res) {
  //TODO: Afficher les détails de la tribu
  //req.params.tribe = (yellow/red)
}

exports.userDetails = function(req, res) {
  //TODO: Afficher les détails de l'user
  //req.params.tribe = (yellow/red)
  //req.params.user = (username)
}

exports.split = function(req, res, season, callback) {

  // Algorithme de Fisher-Yates (permutation aléatoire)
  function fisherYatesShuffle(array) {
    var i = array.length, j, temp;
    while ( --i ) {
       j = Math.floor( Math.random() * ( i + 1 ) );
       temp = array[i];
       array[i] = array[j];
       array[j] = temp;
     }
  }

  userModel.findUsersByType('leader', function(result) {

    var usersList = result.rows;
    var usersListSorted = [];
    var nbUsers = result.rowCount;
    var usersPerTeam = Math.round((nbUsers)/2);

    // Mélange aléatoire des joueurs
    fisherYatesShuffle(usersList);

    // Répartition dans les deux équipes
    for (var i = 0; i < usersPerTeam; i++)
      usersListSorted[i] = {tribe:'red', season:season, id:usersList[i].id};

    for (var j = usersPerTeam; j < nbUsers; j++)
      usersListSorted[j] = {tribe:'yellow', season:season, id:usersList[j].id};

    // Ajoute chaque joueur les uns après les autres dans la BDD
    async.eachSeries(usersListSorted, tribeModel.addUserInTribe, function(err){
      if(!err) callback();
    });
  });
}

exports.reunification = function(req, res, callback) {
  //TODO: Réunification des équipes
}