'use strict';

/* eslint max-len:0 */
var themes = require('../../themes');
var tools = require('../../tools');

var _ = require('lodash');
var http = require('good-guy-http')();
var noon = require('noon');

var CFILE = process.env.HOME + '/.iloa.noon';

exports.command = 'entry <id>';
exports.desc = 'Returns data for a single hierarchy and its internal relationships';
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
  common: {
    alias: 'm',
    desc: "All common names for the page's taxon",
    default: false,
    type: 'boolean'
  },
  synonym: {
    alias: 'y',
    desc: "All synonyms for the page's taxon",
    default: false,
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
    common: argv.m,
    synonym: argv.y,
    cachettl: argv.c,
    language: argv.g
  };
  if (config.merge) config = _.merge({}, config, userConfig);
  if (argv.s && config.merge) noon.save(CFILE, config);
  if (argv.s && !config.merge) throw new Error("Can't save user config, set option merge to true.");
  var theme = themes.loadTheme(config.theme);
  if (config.verbose) themes.label(theme, 'down', 'Encyclopedia of Life');
  var prefix = 'http://eol.org/api/hierarchy_entries/1.0/' + argv.id + '.json';
  var ucont = [];
  ucont.push('common_names=' + argv.m);
  ucont.push('synonyms=' + argv.y);
  ucont.push('cachettl=' + argv.c);
  ucont.push('language=' + argv.g);
  ucont.push('key=' + process.env.EOLKEY);
  var url = prefix + '?' + ucont.join('&');
  var tofile = {
    type: 'entry',
    source: 'http://eol.org'
  };
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      themes.label(theme, 'right', 'Source ID', body.sourceIdentifier);
      tofile.sourceIdentifier = body.sourceIdentifier;
      themes.label(theme, 'right', 'Taxon ID', body.taxonID);
      tofile.taxonID = body.taxonID;
      themes.label(theme, 'right', 'Parent Name Usage ID', body.parentNameUsageID);
      tofile.parentNameUsageID = body.parentNameUsageID;
      themes.label(theme, 'right', 'Scientific Name', body.scientificName);
      tofile.scientificName = body.scientificName;
      themes.label(theme, 'right', 'Taxon Rank', body.taxonRank);
      tofile.taxonRank = body.taxonRank;
      themes.label(theme, 'right', 'Source', body.source);
      tofile.source = body.source;
      themes.label(theme, 'right', 'Name According To', tools.arrToStr(body.nameAccordingTo));
      tofile.nameAccordingTo = body.nameAccordingTo;
      if (body.vernacularNames) {
        var vern = body.vernacularNames;
        tofile.vernacular = {};
        for (var i = 0; i <= vern.length - 1; i++) {
          var item = vern[i];
          if (item.language === argv.g) {
            if (item.eol_preferred) {
              themes.label(theme, 'right', 'Vernacular Name', item.vernacularName + ' -> *preferred*');
              tofile.vernacular[['preferredName' + i]] = item.vernacularName;
            } else {
              themes.label(theme, 'right', 'Vernacular', item.vernacularName);
              tofile.vernacular[['name' + i]] = item.vernacularName;
            }
          }
        }
      }
      if (body.synonyms !== []) {
        tofile.synonyms = {};
        themes.label(theme, 'right', 'Synonyms');
        for (var _i = 0; _i <= body.synonyms.length - 1; _i++) {
          var _item = body.synonyms[_i];
          themes.label(theme, 'right', 'Synonym', _item.synonym);
          themes.label(theme, 'right', 'Relationship', _item.relationship);
          tofile.synonyms[['synonym' + _i]] = _item.synonym;
          tofile.synonyms[['relatioship' + _i]] = _item.relationship;
          if (_item.resource !== '') {
            themes.label(theme, 'right', 'Resource', _item.resource);
            tofile.synonyms[['resource' + _i]] = _item.resource;
          }
        }
      }
      if (body.taxonConcepts) {
        tofile.taxonConcepts = {};
        themes.label(theme, 'right', 'Taxon Concepts');
        for (var _i2 = 0; _i2 <= body.taxonConcepts.length - 1; _i2++) {
          var _item2 = body.taxonConcepts[_i2];
          themes.label(theme, 'right', 'ID', _item2.identifier);
          themes.label(theme, 'right', 'Scientific Name', _item2.scientificName);
          themes.label(theme, 'right', 'According to', _item2.nameAccordingTo);
          themes.label(theme, 'right', 'Canonical', _item2.canonicalForm);
          themes.label(theme, 'right', 'Source ID', _item2.sourceIdentifier);
          themes.label(theme, 'right', 'Taxon Rank', _item2.taxonRank);
          tofile.taxonConcepts[['id' + _i2]] = _item2.identifier;
          tofile.taxonConcepts[['scientificName' + _i2]] = _item2.scientificName;
          tofile.taxonConcepts[['accordingTo' + _i2]] = _item2.nameAccordingTo;
          tofile.taxonConcepts[['canonical' + _i2]] = _item2.canonicalForm;
          tofile.taxonConcepts[['sourceIdentifier' + _i2]] = _item2.sourceIdentifier;
          tofile.taxonConcepts[['taxonRank' + _i2]] = _item2.taxonRank;
        }
      }
      if (body.ancestors !== []) {
        tofile.ancestors = {};
        themes.label(theme, 'right', 'Ancestors');
        for (var _i3 = 0; _i3 <= body.ancestors.length - 1; _i3++) {
          var _item3 = body.ancestors[_i3];
          themes.label(theme, 'right', 'Source ID', _item3.sourceIdentifier);
          tofile.ancestors[['sourceIdentifier' + _i3]] = _item3.sourceIdentifier;
          themes.label(theme, 'right', 'Taxon ID', _item3.taxonID);
          tofile.ancestors[['taxonID' + _i3]] = _item3.taxonID;
          themes.label(theme, 'right', 'Parent Name Usage ID', _item3.parentNameUsageID);
          tofile.ancestors[['parentNameUsageID' + _i3]] = _item3.parentNameUsageID;
          themes.label(theme, 'right', 'Taxon Concept ID', _item3.taxonConceptID);
          tofile.ancestors[['taxonConceptID' + _i3]] = _item3.taxonConceptID;
          themes.label(theme, 'right', 'Scientific Name', _item3.scientificName);
          tofile.ancestors[['scientificName' + _i3]] = _item3.scientificName;
          themes.label(theme, 'right', 'Taxon Rank', _item3.taxonRank);
          tofile.ancestors[['taxonRank' + _i3]] = _item3.taxonRank;
          themes.label(theme, 'right', 'Source', _item3.source);
          tofile.ancestors[['source' + _i3]] = _item3.source;
        }
      }
      if (body.children !== []) {
        tofile.children = {};
        themes.label(theme, 'right', 'Children');
        for (var _i4 = 0; _i4 <= body.children.length - 1; _i4++) {
          var _item4 = body.children[_i4];
          themes.label(theme, 'right', 'Source ID', _item4.sourceIdentifier);
          tofile.children[['sourceIdentifier' + _i4]] = _item4.sourceIdentifier;
          themes.label(theme, 'right', 'Taxon ID', _item4.taxonID);
          tofile.children[['taxonID' + _i4]] = _item4.taxonID;
          themes.label(theme, 'right', 'Parent Name Usage ID', _item4.parentNameUsageID);
          tofile.children[['parentNameUsageID' + _i4]] = _item4.parentNameUsageID;
          themes.label(theme, 'right', 'Taxon Concept ID', _item4.taxonConceptID);
          tofile.children[['taxonConceptID' + _i4]] = _item4.taxonConceptID;
          themes.label(theme, 'right', 'Scientific Name', _item4.scientificName);
          tofile.children[['scientificName' + _i4]] = _item4.scientificName;
          themes.label(theme, 'right', 'Taxon Rank', _item4.taxonRank);
          tofile.children[['taxonRank' + _i4]] = _item4.taxonRank;
          themes.label(theme, 'right', 'Source', _item4.source);
          tofile.children[['source' + _i4]] = _item4.source;
        }
      }
      if (argv.o) tools.outFile(argv.o, argv.f, tofile);
    } else {
      throw new Error(error);
    }
  });
};