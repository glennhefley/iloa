'use strict';

/* eslint max-len:0 */
var themes = require('../../themes');
var tools = require('../../tools');

var _ = require('lodash');
var http = require('good-guy-http')();
var noon = require('noon');

var CFILE = process.env.HOME + '/.iloa.noon';

exports.command = 'page <id>';
exports.desc = 'Returns data for a given page ID number';
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
  batch: {
    alias: 'b',
    desc: 'Batch response',
    default: false,
    type: 'boolean'
  },
  imagepage: {
    desc: 'Which images page',
    default: 1,
    type: 'number'
  },
  imagepp: {
    desc: 'No. of images/page 0-75',
    default: 1,
    type: 'number'
  },
  videopage: {
    desc: 'Which videos page',
    default: 1,
    type: 'number'
  },
  videopp: {
    desc: 'No. of videos/page 0-75',
    default: 1,
    type: 'number'
  },
  soundpage: {
    desc: 'Which sounds page',
    default: 1,
    type: 'number'
  },
  soundpp: {
    desc: 'No. of sounds/page 0-75',
    default: 1,
    type: 'number'
  },
  mapspage: {
    desc: 'Which maps page',
    default: 1,
    type: 'number'
  },
  mapspp: {
    desc: 'No. of maps/page 0-75',
    default: 1,
    type: 'number'
  },
  textpage: {
    desc: 'Which texts page',
    default: 1,
    type: 'number'
  },
  textpp: {
    desc: 'No. of texts/page 0-75',
    default: 1,
    type: 'number'
  },
  iucn: {
    alias: 'n',
    desc: 'IUCN Red List status',
    default: false,
    type: 'boolean'
  },
  subjects: {
    alias: 'j',
    desc: tools.wrapStr("'overview' to return the overview text (if exists), a pipe | delimited list of subject names from the list of EOL accepted subjects (e.g. TaxonBiology, FossilHistory), or 'all' to get text in any subject. Always returns an overview text as a first result (if one exists in the given context).", true, true),
    default: 'overview',
    type: 'string'
  },
  license: {
    alias: 'l',
    desc: tools.wrapStr("a pipe | delimited list of licenses or 'all' to get objects under any license. Licenses abbreviated cc- are all Creative Commons licenses. Visit their site for more information on the various licenses they offer.", true, true),
    default: 'all',
    type: 'string'
  },
  details: {
    alias: 'd',
    desc: 'Include all metadata for data objects',
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
  reference: {
    alias: 'r',
    desc: "All references for the page's taxon",
    default: false,
    type: 'boolean'
  },
  taxonomy: {
    alias: 'x',
    desc: tools.wrapStr("Any taxonomy details from different taxon hierarchy providers, in an array named 'taxonConcepts'", true, true),
    default: true,
    type: 'boolean'
  },
  vetted: {
    alias: 'e',
    desc: tools.wrapStr("If 'vetted' is given a value of '1', then only trusted content will be returned. If 'vetted' is '2', then only trusted and unreviewed content will be returned (untrusted content will not be returned). If 'vetted' is '3', then only unreviewed content will be returned. If 'vetted' is '4', then only untrusted content will be returned.The default is to return all content.", true, true),
    default: 0,
    type: 'number'
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
    batch: argv.b,
    id: argv.id,
    imagepage: argv.imagepage,
    imagepp: argv.imagepp,
    videopage: argv.videopage,
    videopp: argv.videopp,
    mapspage: argv.mapspage,
    mapspp: argv.mapspp,
    soundpage: argv.soundpage,
    soundpp: argv.soundpp,
    textpage: argv.textpage,
    textpp: argv.textpp,
    iucn: argv.n,
    subjects: argv.j,
    license: argv.l,
    details: argv.d,
    common: argv.m,
    synonym: argv.y,
    reference: argv.r,
    taxonomy: argv.x,
    vetted: argv.e,
    cachettl: argv.c,
    language: argv.g
  };
  if (config.merge) config = _.merge({}, config, userConfig);
  if (argv.s && config.merge) noon.save(CFILE, config);
  if (argv.s && !config.merge) throw new Error("Can't save user config, set option merge to true.");
  var theme = themes.loadTheme(config.theme);
  if (config.verbose) themes.label(theme, 'down', 'Encyclopedia of Life');
  var prefix = 'http://eol.org/api/pages/1.0.json';
  var ucont = [];
  ucont.push('batch=' + argv.b);
  ucont.push('id=' + argv.id);
  ucont.push('images_page=' + argv.imagepage);
  ucont.push('images_per_page=' + argv.imagepp);
  ucont.push('videos_page=' + argv.videopage);
  ucont.push('videos_per_page=' + argv.videopp);
  ucont.push('sounds_page=' + argv.soundpage);
  ucont.push('sounds_per_page=' + argv.soundpp);
  ucont.push('texts_page=' + argv.textpage);
  ucont.push('texts_per_page=' + argv.textpp);
  ucont.push('maps_page=' + argv.mapspage);
  ucont.push('maps_per_page=' + argv.mapspp);
  ucont.push('iucn=' + argv.n);
  ucont.push('subjects=' + argv.j);
  ucont.push('licenses=' + argv.l);
  ucont.push('details=' + argv.d);
  ucont.push('common_names=' + argv.m);
  ucont.push('synonyms=' + argv.y);
  ucont.push('references=' + argv.r);
  ucont.push('taxonomy=' + argv.x);
  ucont.push('vetted=' + argv.e);
  ucont.push('cachettl=' + argv.c);
  ucont.push('language=' + argv.g);
  ucont.push('key=' + process.env.EOLKEY);
  var url = prefix + '?' + ucont.join('&');
  var tofile = {
    type: 'pages',
    source: 'http://eol.org'
  };
  http({ url: url }, function (error, response) {
    if (!error && response.statusCode === 200) {
      var body = JSON.parse(response.body);
      themes.label(theme, 'right', 'Identifier', body.identifier);
      tofile.id = body.identifier;
      themes.label(theme, 'right', 'Scientific Name', body.scientificName);
      tofile.scientificName = body.scientificName;
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
      if (body.references) {
        (function () {
          tofile.references = {};
          themes.label(theme, 'right', 'References');
          var i = 0;
          _.each(body.references, function (value) {
            console.log(tools.wrapStr(value, true, true));
            tofile.references[['ref' + i]] = value;
            i++;
          });
        })();
      }
      if (body.synonyms) {
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
      if (body.dataObjects && body.dataObjects !== []) {
        tofile.dataObjects = {};
        themes.label(theme, 'right', 'Data Objects');
        for (var _i3 = 0; _i3 <= body.dataObjects.length - 1; _i3++) {
          var _item3 = body.dataObjects[_i3];
          themes.label(theme, 'right', 'id', _item3.identifier);
          tofile.dataObjects[['id' + _i3]] = _item3.identifier;
          themes.label(theme, 'right', 'dataType', _item3.dataType);
          tofile.dataObjects[['dataType' + _i3]] = _item3.dataType;
          if (_item3.dataSubtype !== '') {
            themes.label(theme, 'right', 'Data Subtype', _item3.dataSubtype);
            tofile.dataObjects[['dataSubtype' + _i3]] = _item3.dataSubtype;
          }
          themes.label(theme, 'right', 'vettedStatus', _item3.vettedStatus);
          tofile.dataObjects[['vettedStatus' + _i3]] = _item3.vettedStatus;
          themes.label(theme, 'right', 'dataRating', _item3.dataRating);
          tofile.dataObjects[['dataRating' + _i3]] = _item3.dataRating;
          if (_item3.subject) {
            themes.label(theme, 'right', 'subject', _item3.subject);
            tofile.dataObjects[['subject' + _i3]] = _item3.subject;
          }
          if (_item3.mimeType) {
            themes.label(theme, 'right', 'mimeType', _item3.mimeType);
            tofile.dataObjects[['mimeType' + _i3]] = _item3.mimeType;
          }
          var dtprefix = 'http://purl.org/dc/dcmitype/';
          if (_item3.dataType === dtprefix + 'StillImage' || _item3.dataType === dtprefix + 'MovingImage' || _item3.dataType === dtprefix + 'Sound') {
            if (_item3.title) {
              themes.label(theme, 'right', 'Title', _item3.title);
              tofile.dataObjects[['title' + _i3]] = _item3.title;
            }
            if (_item3.mediaURL) {
              themes.label(theme, 'right', 'URL', _item3.mediaURL);
              tofile.dataObjects[['mediaURL' + _i3]] = _item3.mediaURL;
            }
            if (_item3.location) {
              themes.label(theme, 'right', 'Location', _item3.location);
              tofile.dataObjects[['location' + _i3]] = _item3.location;
            }
            if (_item3.eolMediaURL) {
              themes.label(theme, 'right', 'EOL URL', _item3.eolMediaURL);
              tofile.dataObjects[['eolMediaURL' + _i3]] = _item3.eolMediaURL;
            }
          }
          if (_item3.created) {
            themes.label(theme, 'right', 'created', _item3.created);
            tofile.dataObjects[['created' + _i3]] = _item3.created;
          }
          if (_item3.modified) {
            themes.label(theme, 'right', 'modified', _item3.modified);
            tofile.dataObjects[['modified' + _i3]] = _item3.modified;
          }
          if (_item3.language) {
            themes.label(theme, 'right', 'language', _item3.language);
            tofile.dataObjects[['language' + _i3]] = _item3.language;
          }
          if (_item3.license) {
            themes.label(theme, 'right', 'license', _item3.license);
            tofile.dataObjects[['license' + _i3]] = _item3.license;
          }
          if (_item3.rightsHolder) {
            themes.label(theme, 'right', 'rightsHolder', _item3.rightsHolder);
            tofile.dataObjects[['rightsHolder' + _i3]] = _item3.rightsHolder;
          }
          if (_item3.source) {
            themes.label(theme, 'right', 'source', _item3.source);
            tofile.dataObjects[['source' + _i3]] = _item3.source;
          }
          if (_item3.description) {
            themes.label(theme, 'right', 'description', tools.wrapStr(_item3.description, true, true));
            tofile.dataObjects[['description' + _i3]] = _item3.description;
          }
          if (_item3.agents && _item3.agents !== []) {
            themes.label(theme, 'right', 'Agents');
            tofile.dataObjects[['agent' + _i3]] = {};
            for (var j = 0; j <= _item3.agents.length - 1; j++) {
              var subitem = _item3.agents[j];
              themes.label(theme, 'right', 'full_name', subitem.full_name);
              themes.label(theme, 'right', 'homepage', subitem.homepage);
              themes.label(theme, 'right', 'role', subitem.role);
              tofile.dataObjects[['agent' + _i3]][['full_name' + j]] = subitem.full_name;
              tofile.dataObjects[['agent' + _i3]][['homepage' + j]] = subitem.homepage;
              tofile.dataObjects[['agent' + _i3]][['role' + j]] = subitem.role;
            }
          }
        }
      }
      if (argv.o) tools.outFile(argv.o, argv.f, tofile);
    } else {
      throw new Error(error);
    }
  });
};