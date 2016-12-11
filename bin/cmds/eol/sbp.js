'use strict';

/* eslint max-len:0 */
var themes = require('../../themes');
var tools = require('../../tools');

var _ = require('lodash');
var http = require('good-guy-http')();
var noon = require('noon');

var CFILE = process.env.HOME + '/.iloa.noon';

exports.command = 'sbp <id>';
exports.desc = 'Search for an entry within a given provider';
exports.builder = {
  out: {
    alias: 'o',
    desc: 'Write cson, json, noon, plist, yaml, xml',
    default: '',
    type: 'string'
  },
  force: {
    alias: 'f',
    desc: 'Force overwriting outfile',
    default: false,
    type: 'boolean'
  },
  save: {
    alias: 's',
    desc: 'Save options to config file',
    default: false,
    type: 'boolean'
  },
  pid: {
    alias: 'p',
    desc: "A provider ID from the 'info' command",
    default: 903,
    type: 'number'
  },
  cachettl: {
    alias: 'c',
    desc: 'No. of seconds you wish to have the response cached',
    default: 60,
    type: 'number'
  }
};
exports.handler = function (argv) {
  tools.checkConfig(CFILE);
  var config = noon.load(CFILE);
  var userConfig = {
    pid: argv.p,
    cachettl: argv.c
  };
  if (config.merge) config = _.merge({}, config, userConfig);
  if (argv.s && config.merge) noon.save(CFILE, config);
  if (argv.s && !config.merge) throw new Error("Can't save user config, set option merge to true.");
  var theme = themes.loadTheme(config.theme);
  if (config.verbose) themes.label(theme, 'down', 'Encyclopedia of Life');
  var prefix = 'http://eol.org/api/search_by_provider/1.0.json';
  var ucont = [];
  ucont.push('batch=false');
  ucont.push('id=' + argv.id);
  ucont.push('hierarchy_id=' + argv.p);
  ucont.push('cachettl=' + argv.c);
  ucont.push('key=' + process.env.EOLKEY);
  var url = prefix + '?' + ucont.join('&');
  var tofile = {
    type: 'search_by_provider',
    source: 'http://eol.org'
  };
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      var pid = body[0];
      var link = body[1];
      themes.label(theme, 'right', 'Page ID', pid.eol_page_id);
      tofile.eol_page_id = pid.eol_page_id;
      themes.label(theme, 'right', 'Page Link', link.eol_page_link);
      tofile.eol_page_link = link.eol_page_link;
      if (argv.o) tools.outFile(argv.o, argv.f, tofile);
    } else {
      throw new Error(error);
    }
  });
};