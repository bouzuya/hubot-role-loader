// Description
//   A Hubot script for loading the roles to robot.brain
//
// Configuration:
//   HUBOT_ROLE_LOADER_ACCESS_KEY_ID
//   HUBOT_ROLE_LOADER_SECRET_ACCESS_KEY
//   HUBOT_ROLE_LOADER_REGION
//   HUBOT_ROLE_LOADER_BUCKET
//   HUBOT_ROLE_LOADER_KEY
//
// Commands:
//   None
//
// Author:
//   bouzuya <m@bouzuya.net>
//
var AWS, Promise, config, _ref, _ref1;

AWS = require('aws-sdk');

Promise = require('es6-promise').Promise;

config = {
  accessKeyId: process.env.HUBOT_ROLE_LOADER_ACCESS_KEY_ID,
  secretAccessKey: process.env.HUBOT_ROLE_LOADER_SECRET_ACCESS_KEY,
  region: (_ref = process.env.HUBOT_ROLE_LOADER_REGION) != null ? _ref : 'ap-northeast-1',
  bucket: process.env.HUBOT_ROLE_LOADER_BUCKET,
  key: (_ref1 = process.env.HUBOT_ROLE_LOADER_KEY) != null ? _ref1 : 'roles.json'
};

module.exports = function(robot) {
  var fetch, load, merge;
  fetch = function() {
    return new Promise(function(resolve, reject) {
      var s3;
      s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region
      });
      return s3.getObject({
        Bucket: config.bucket,
        Key: config.key
      }, function(err, data) {
        if (err != null) {
          return reject(err);
        }
        return resolve(JSON.parse(data.Body.toString('utf-8')));
      });
    });
  };
  merge = function(roles) {
    var users, _ref2;
    users = (_ref2 = robot.brain.data.users) != null ? _ref2 : {};
    return roles.forEach(function(role) {
      return role.users.forEach(function(userName) {
        return Object.keys(users).forEach(function(key) {
          var u;
          u = users[key];
          if (u.name === userName) {
            if (u.roles == null) {
              u.roles = [];
            }
            if (u.roles.filter(function(r) {
              return r === role.name;
            }).length === 0) {
              return u.roles.push(role.name);
            }
          }
        });
      });
    });
  };
  load = function() {
    if (config.accessKeyId == null) {
      return robot.logger.error('HUBOT_ROLE_LOADER_ACCESS_KEY_ID');
    }
    if (config.secretAccessKey == null) {
      return robot.logger.error('HUBOT_ROLE_LOADER_SECRET_ACCESS_KEY');
    }
    if (config.region == null) {
      return robot.logger.error('HUBOT_ROLE_LOADER_REGION');
    }
    if (config.bucket == null) {
      return robot.logger.error('HUBOT_ROLE_LOADER_BUCKET');
    }
    if (config.key == null) {
      return robot.logger.error('HUBOT_ROLE_LOADER_KEY');
    }
    return fetch().then(merge)["catch"](function(e) {
      return robot.logger.error(e);
    });
  };
  robot.brain.on('loaded', load);
  return load();
};
