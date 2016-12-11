'use strict';

/* eslint max-len:0, no-unused-vars:0 */
var themes = require('../../themes');
var tools = require('../../tools');

var http = require('good-guy-http')();
var noon = require('noon');

var CFILE = process.env.HOME + '/.iloa.noon';

exports.command = 'info';
exports.desc = 'Print provider hierarchies and service status';
exports.builder = {};
exports.handler = function (argv) {
  tools.checkConfig(CFILE);
  var config = noon.load(CFILE);
  var theme = themes.loadTheme(config.theme);
  if (config.verbose) themes.label(theme, 'down', 'Encyclopedia of Life');
  var url = 'http://eol.org/api/ping/1.0.json?key=' + process.env.EOLKEY;
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      body.response.message === 'Success' ? themes.label(theme, 'right', 'Service Status', 'OK') : console.log("Something's not working.");
    } else {
      throw new Error('HTTP ' + error.statusCode + ': ' + error.reponse.body);
    }
  });
  url = 'http://eol.org/api/provider_hierarchies/1.0.json?' + process.env.EOLKEY;
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      themes.label(theme, 'right', 'Provider Hierarchies');
      for (var i = 0; i <= body.length - 1; i++) {
        var item = body[i];
        themes.label(theme, 'right', 'ID', item.id);
        themes.label(theme, 'right', 'Label', item.label);
      }
    } else {
      throw new Error(error);
    }
  });
};