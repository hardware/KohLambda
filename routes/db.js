var pg = require('pg');

exports.upsert = function(table, fields, whereFields) {
  //UPSERT fields INTO table WHERE whereFields
}

exports.gameSettings = function(callback) {
  var gameSettings = {};
  
  pg.connect...
  
  callback(gameSettings);
}

exports.userSettings = function(callback) {
  var userSettings = {};
  
  pg.connect...
  
  callback(userSettings);
}