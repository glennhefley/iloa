'use strict';

/* eslint max-len:0 */
var themes = require('../../themes');
var tools = require('../../tools');

var _ = require('lodash');
var http = require('good-guy-http')();
var noon = require('noon');

var CFILE = process.env.HOME + '/.iloa.noon';

exports.command = 'meta <id>';
exports.desc = 'Returns metadata for given data object';
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
  taxonomy: {
    alias: 'x',
    desc: tools.wrapStr("return any taxonomy details from different taxon hierarchy providers, in an array named 'taxonConcepts'", true, true),
    default: true,
    type: 'boolean'
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
    cachettl: argv.c,
    language: argv.g,
    taxonomy: argv.x
  };
  if (config.merge) config = _.merge({}, config, userConfig);
  if (argv.s && config.merge) noon.save(CFILE, config);
  if (argv.s && !config.merge) throw new Error("Can't save user config, set option merge to true.");
  var theme = themes.loadTheme(config.theme);
  if (config.verbose) themes.label(theme, 'down', 'Encyclopedia of Life');
  var prefix = 'http://eol.org/api/data_objects/1.0/' + argv.id + '.json';
  var ucont = [];
  ucont.push('taxonomy=' + argv.x);
  ucont.push('language=' + argv.g);
  ucont.push('cachettl=' + argv.c);
  ucont.push('key=' + process.env.EOLKEY);
  var url = prefix + '?' + ucont.join('&');
  var tofile = {
    type: 'metadata',
    source: 'http://eol.org'
  };
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      tofile.metadata = {};
      themes.label(theme, 'right', 'ID', body.identifier);
      tofile.metadata.id = body.identifier;
      themes.label(theme, 'right', 'Scientific Name', body.scientificName);
      tofile.metadata.scientificName = body.scientificName;
      themes.label(theme, 'right', 'Richness Score', body.richness_score);
      tofile.metadata.richness_score = body.richness_score;
      if (body.taxonConcepts) {
        tofile.taxonConcepts = {};
        themes.label(theme, 'right', 'Taxon Concepts');
        for (var i = 0; i <= body.taxonConcepts.length - 1; i++) {
          var item = body.taxonConcepts[i];
          themes.label(theme, 'right', 'ID', item.identifier);
          themes.label(theme, 'right', 'Scientific Name', item.scientificName);
          themes.label(theme, 'right', 'According to', item.nameAccordingTo);
          themes.label(theme, 'right', 'Canonical', item.canonicalForm);
          themes.label(theme, 'right', 'Source ID', item.sourceIdentifier);
          themes.label(theme, 'right', 'Taxon Rank', item.taxonRank);
          tofile.taxonConcepts[['id' + i]] = item.identifier;
          tofile.taxonConcepts[['scientificName' + i]] = item.scientificName;
          tofile.taxonConcepts[['accordingTo' + i]] = item.nameAccordingTo;
          tofile.taxonConcepts[['canonical' + i]] = item.canonicalForm;
          tofile.taxonConcepts[['sourceIdentifier' + i]] = item.sourceIdentifier;
          tofile.taxonConcepts[['taxonRank' + i]] = item.taxonRank;
        }
      }
      if (body.dataObjects) {
        tofile.dataObjects = {};
        themes.label(theme, 'right', 'Data Objects');
        for (var _i = 0; _i <= body.dataObjects.length - 1; _i++) {
          var _item = body.dataObjects[_i];
          themes.label(theme, 'right', 'id', _item.identifier);
          tofile.dataObjects[['id' + _i]] = _item.identifier;
          themes.label(theme, 'right', 'dataType', _item.dataType);
          tofile.dataObjects[['dataType' + _i]] = _item.dataType;
          if (_item.dataSubtype !== '') {
            themes.label(theme, 'right', 'Data Subtype', _item.dataSubtype);
            tofile.dataObjects[['dataSubtype' + _i]] = _item.dataSubtype;
          }
          themes.label(theme, 'right', 'vettedStatus', _item.vettedStatus);
          tofile.dataObjects[['vettedStatus' + _i]] = _item.vettedStatus;
          themes.label(theme, 'right', 'dataRating', _item.dataRating);
          tofile.dataObjects[['dataRating' + _i]] = _item.dataRating;
          themes.label(theme, 'right', 'subject', _item.subject);
          tofile.dataObjects[['subject' + _i]] = _item.subject;
          themes.label(theme, 'right', 'mimeType', _item.mimeType);
          var dtprefix = 'http://purl.org/dc/dcmitype/';
          tofile.dataObjects[['mimeType' + _i]] = _item.mimeType;
          if (_item.dataType === dtprefix + 'StillImage' || _item.dataType === dtprefix + 'MovingImage' || _item.dataType === dtprefix + 'Sound') {
            themes.label(theme, 'right', 'Title', _item.title);
            tofile.dataObjects[['title' + _i]] = _item.title;
            themes.label(theme, 'right', 'URL', _item.mediaURL);
            tofile.dataObjects[['mediaURL' + _i]] = _item.mediaURL;
            if (_item.location) {
              themes.label(theme, 'right', 'Location', _item.location);
              tofile.dataObjects[['location' + _i]] = _item.location;
            }
            themes.label(theme, 'right', 'EOL URL', _item.eolMediaURL);
            tofile.dataObjects[['eolMediaURL' + _i]] = _item.eolMediaURL;
          }
          themes.label(theme, 'right', 'created', _item.created);
          tofile.dataObjects[['created' + _i]] = _item.created;
          themes.label(theme, 'right', 'modified', _item.modified);
          tofile.dataObjects[['modified' + _i]] = _item.modified;
          themes.label(theme, 'right', 'language', _item.language);
          tofile.dataObjects[['language' + _i]] = _item.language;
          themes.label(theme, 'right', 'license', _item.license);
          tofile.dataObjects[['license' + _i]] = _item.license;
          themes.label(theme, 'right', 'rightsHolder', _item.rightsHolder);
          tofile.dataObjects[['rightsHolder' + _i]] = _item.rightsHolder;
          themes.label(theme, 'right', 'source', _item.source);
          tofile.dataObjects[['source' + _i]] = _item.source;
          themes.label(theme, 'right', 'description', tools.wrapStr(_item.description.trim(), true, true));
          tofile.dataObjects[['description' + _i]] = _item.description;
          tofile.dataObjects[['agent' + _i]] = {};
          themes.label(theme, 'right', 'Agents');
          for (var j = 0; j <= _item.agents.length - 1; j++) {
            var subitem = _item.agents[j];
            themes.label(theme, 'right', 'full_name', subitem.full_name);
            themes.label(theme, 'right', 'homepage', subitem.homepage);
            themes.label(theme, 'right', 'role', subitem.role);
            tofile.dataObjects[['agent' + _i]][['full_name' + j]] = subitem.full_name;
            tofile.dataObjects[['agent' + _i]][['homepage' + j]] = subitem.homepage;
            tofile.dataObjects[['agent' + _i]][['role' + j]] = subitem.role;
          }
        }
      }
      if (argv.o) tools.outFile(argv.o, argv.f, tofile);
    } else {
      throw new Error(error);
    }
  });
};