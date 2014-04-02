/*
 * index.js: A simple script to calculate what emails need to be contacted for CFP rejection.
 *
 * (C) 2014, EmpireJS.
 *
 */

var fs = require('fs'),
    path = require('path'),
    async = require('async');

//
// ### function cfpRejector (cfp, names)
// #### @options
// ####   @cfp   {string} *.tsv file for the CFP itself
// ####   @names {string} \n delimited names file
//
var rejector = module.exports = function (options, callback) {
  async.parallel({
    cfp:   async.apply(rejector.parse, options.cfp),
    names: async.apply(fs.readFile, options.names, 'utf8')
  }, function (err, files) {
    if (err) { return callback(err) }

    files.names = files.names
      .split('\n')
      .filter(Boolean)
      .reduce(function (all, name) {
        all[name] = true;
        return all;
      }, {});

    var rejected = files.cfp.reduce(function (all, prop) {
      if (!files.names[prop.author]) {
        all[prop.author.toLowerCase()] = prop;
      }

      return all;
    }, {});

    console.log('Saving %s rejected names to %s', Object.keys(rejected).length, options.out);

    fs.writeFile(
      options.out,
      Object.keys(rejected)
        .map(function (key) {
          return [rejected[key].author, rejected[key].email].join(',')
        }).join('\n'),
      'utf8',
      callback
    );
  });
};

//
// ### function parse (file, callback)
// Parses the *.tsv file. Quite a brittle setup at the moment
//
rejector.parse = function parse(file, callback) {
  console.log('Parsing | %s', file);
  fs.readFile(file, 'utf8', function (err, lines) {
    if (err) { return callback(err) }

    var proposals = lines.split('\n')
      .slice(1)
      .map(function (line) {
        var parts = line.split('\t');

        //
        // TODO: This is very brittle.
        //
        return {
          'author': parts[1],
          'email':  parts[2],
          'twitter': parts[3],
          'title': parts[4],
          'description': parts[5],
          'audience': parts[6],
          'anything-else': parts[7] || ''
        }
      });

    callback(null, proposals);
  });
};