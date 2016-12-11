'use strict';

/* eslint max-len:0 */
var themes = require('../../themes');
var tools = require('../../tools');

var _ = require('lodash');
var http = require('good-guy-http')();
var noon = require('noon');

var CFILE = process.env.HOME + '/.iloa.noon';

exports.command = 'collect <id>';
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
  ppage: {
    alias: 'e',
    desc: '0-500',
    default: 50,
    type: 'number'
  },
  filter: {
    alias: 'l',
    desc: 'articles,collections,communities,images,sounds,taxa,users,video',
    default: '',
    type: 'string'
  },
  by: {
    alias: 'b',
    desc: tools.wrapStr('recently_added,oldest,alphabetical,reverse_alphabetical,richness,rating,sort_field,reverse_sort_field', true, true),
    default: 'recently_added',
    type: 'string'
  },
  field: {
    alias: 'i',
    desc: tools.wrapStr('If a sort_field parameter is included, only collection items whose sort field exactly matches the given string will be returned', true, true),
    default: '',
    type: 'string'
  },
  cachettl: {
    alias: 'c',
    desc: 'No. of seconds you wish to have the response cached',
    default: 60,
    type: 'number'
  },
  language: {
    alias: 'g',
    desc: tools.wrapStr('ms, de, en, es, fr, gl, it, nl, nb, oc, pt-BR, sv, tl, mk, sr, uk, ar, zh-Hans, zh-Hant, ko', true, true),
    default: 'en',
    type: 'string'
  }
};
exports.handler = function (argv) {
  tools.checkConfig(CFILE);
  var config = noon.load(CFILE);
  var userConfig = {
    by: argv.b,
    cachettl: argv.c,
    field: argv.i,
    filter: argv.l,
    language: argv.g,
    page: argv.p,
    ppage: argv.e
  };
  if (config.merge) config = _.merge({}, config, userConfig);
  if (argv.s && config.merge) noon.save(CFILE, config);
  if (argv.s && !config.merge) throw new Error("Can't save user config, set option merge to true.");
  var theme = themes.loadTheme(config.theme);
  if (config.verbose) themes.label(theme, 'down', 'Encyclopedia of Life');
  var prefix = 'http://eol.org/api/collections/1.0/' + argv.id + '.json';
  var ucont = [];
  ucont.push('page=' + argv.p);
  ucont.push('per_page=' + argv.e);
  ucont.push('sort_by=' + argv.b);
  ucont.push('filter=' + argv.l);
  ucont.push('sort_field=' + argv.i);
  ucont.push('cachettl=' + argv.c);
  ucont.push('language=' + argv.g);
  ucont.push('key=' + process.env.EOLKEY);
  var url = prefix + '?' + ucont.join('&');
  var tofile = {
    type: 'collections',
    source: 'http://eol.org'
  };
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      tofile.collections = {};
      themes.label(theme, 'right', 'Total Items', body.total_items);
      tofile.collections.total_items = body.total_items;
      themes.label(theme, 'right', 'Title', body.name);
      tofile.collections.name = body.name;
      themes.label(theme, 'right', 'Description', body.description);
      tofile.collections.description = body.description;
      themes.label(theme, 'right', 'Logo', body.logo_url);
      tofile.collections.logo_url = body.logo_url;
      themes.label(theme, 'right', 'Score', body.richness_score);
      tofile.collections.richness_score = body.richness_score;
      for (var i = 0; i <= body.item_types.length - 1; i++) {
        var item = body.item_types[i];
        themes.label(theme, 'right', item.item_type, item.item_count);
        tofile.collections[['item_type' + i]] = item.item_type;
        tofile.collections[['item_count' + i]] = item.item_count;
      }
      for (var j = 0; j <= body.collection_items.length - 1; j++) {
        var _item = body.collection_items[j];
        themes.label(theme, 'right', 'Name', _item.name);
        tofile.collections[['item_name' + j]] = _item.name;
        themes.label(theme, 'right', 'Title', _item.title);
        tofile.collections[['item_title' + j]] = _item.title;
        themes.label(theme, 'right', 'Object Type', _item.object_type);
        tofile.collections[['object_type' + j]] = _item.object_type;
        themes.label(theme, 'right', 'Object ID', _item.object_id);
        tofile.collections[['object_id' + j]] = _item.object_id;
        if (_item.object_type === 'Image') {
          themes.label(theme, 'right', 'Rating', _item.data_rating);
          tofile.collections[['data_rating' + j]] = _item.data_rating;
          themes.label(theme, 'right', 'GUID', _item.object_guid);
          tofile.collections[['object_guid' + j]] = _item.object_guid;
          themes.label(theme, 'right', 'Source', _item.source);
          tofile.collections[['source' + j]] = _item.source;
        }
      }
      if (argv.o) tools.outFile(argv.o, argv.f, tofile);
    } else {
      throw new Error(error);
    }
  });
};