'use strict';

/* eslint max-len:0 */
var themes = require('../../themes');
var tools = require('../../tools');

var _ = require('lodash');
var http = require('good-guy-http')();
var noon = require('noon');

var CFILE = process.env.HOME + '/.iloa.noon';

exports.command = 'search <query>';
exports.desc = 'Returns entries that match a string query';
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
  page: {
    alias: 'p',
    desc: 'Page number',
    default: 1,
    type: 'number'
  },
  exact: {
    alias: 'x',
    desc: 'Exact match',
    default: false,
    type: 'boolean'
  },
  tfilter: {
    alias: 't',
    desc: 'given an EOL page ID, search results will be limited to members of that taxonomic group',
    default: 0,
    type: 'number'
  },
  hfilter: {
    alias: 'l',
    desc: 'given a Hierarchy Entry ID, search results will be limited to members of that taxonomic group',
    default: 0,
    type: 'number'
  },
  string: {
    alias: 'r',
    desc: 'given a search term, an exact search will be made and that matching page will be used as the taxonomic group against which to filter search results',
    default: '',
    type: 'string'
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
    page: argv.p,
    exact: argv.x,
    tfilter: argv.t,
    hfilter: argv.h,
    string: argv.r,
    cachettl: argv.c
  };
  if (config.merge) config = _.merge({}, config, userConfig);
  if (argv.s && config.merge) noon.save(CFILE, config);
  if (argv.s && !config.merge) throw new Error("Can't save user config, set option merge to true.");
  var theme = themes.loadTheme(config.theme);
  if (config.verbose) themes.label(theme, 'down', 'Encyclopedia of Life');
  var prefix = 'http://eol.org/api/search/1.0.json';
  var ucont = [];
  ucont.push('q=' + argv.query);
  ucont.push('page=' + argv.p);
  ucont.push('exact=' + argv.x);
  ucont.push('filter_by_taxon_concept_id=' + argv.t);
  ucont.push('filter_by_hierarchy_entry_id=' + argv.h);
  ucont.push('filter_by_string=' + argv.r);
  ucont.push('cachettl=' + argv.c);
  ucont.push('key=' + process.env.EOLKEY);
  var url = prefix + '?' + ucont.join('&');
  var tofile = {
    type: 'search',
    source: 'http://eol.org'
  };
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      tofile.search = {};
      themes.label(theme, 'right', 'Total results', body.totalResults);
      tofile.search.totalResults = body.totalResults;
      var results = body.results;
      for (var i = 0; i <= results.length - 1; i++) {
        tofile.search[['result' + i]] = {};
        var item = results[i];
        themes.label(theme, 'right', 'Title', item.title);
        tofile.search[['result' + i]].title = item.title;
        themes.label(theme, 'right', 'ID', item.id);
        tofile.search[['result' + i]].id = item.id;
        themes.label(theme, 'right', 'Link', item.link);
        tofile.search[['result' + i]].link = item.link;
        themes.label(theme, 'right', 'Content', item.content);
        tofile.search[['result' + i]].content = item.content;
      }
      if (argv.o) tools.outFile(argv.o, argv.f, tofile);
    } else {
      throw new Error(error);
    }
  });
};