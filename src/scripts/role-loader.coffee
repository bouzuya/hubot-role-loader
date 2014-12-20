# Description
#   A Hubot script for loading the roles to robot.brain
#
# Configuration:
#   HUBOT_ROLE_LOADER_ACCESS_KEY_ID
#   HUBOT_ROLE_LOADER_SECRET_ACCESS_KEY
#   HUBOT_ROLE_LOADER_REGION
#   HUBOT_ROLE_LOADER_BUCKET
#   HUBOT_ROLE_LOADER_KEY
#
# Commands:
#   None
#
# Author:
#   bouzuya <m@bouzuya.net>
#
AWS = require 'aws-sdk'
{Promise} = require 'es6-promise'

config =
  accessKeyId: process.env.HUBOT_ROLE_LOADER_ACCESS_KEY_ID
  secretAccessKey: process.env.HUBOT_ROLE_LOADER_SECRET_ACCESS_KEY
  region: process.env.HUBOT_ROLE_LOADER_REGION ? 'ap-northeast-1'
  bucket: process.env.HUBOT_ROLE_LOADER_BUCKET
  key:  process.env.HUBOT_ROLE_LOADER_KEY ? 'roles.json'

module.exports = (robot) ->

  fetch = ->
    new Promise (resolve, reject) ->
      s3 = new AWS.S3
        apiVersion: '2006-03-01'
        accessKeyId: config.accessKeyId
        secretAccessKey: config.secretAccessKey
        region: config.region
      s3.getObject
        Bucket: config.bucket
        Key: config.key
      , (err, data) ->
        return reject(err) if err?
        resolve JSON.parse data.Body.toString('utf-8')

  # roles = [
  #   name: '<role name>'
  #   users: [
  #     '<user name>'
  #   ]
  # ,
  #   ...
  # ]
  merge = (roles) ->
    users = robot.brain.data.users ? {}
    roles.forEach (role) ->
      role.users.forEach (userName) ->
        Object.keys(users).forEach (key) ->
          u = users[key]
          if u.name is userName
            u.roles ?= []
            if u.roles.filter((r) -> r is role.name).length is 0
              u.roles.push role.name

  load = ->
    unless config.accessKeyId?
      return robot.logger.error('HUBOT_ROLE_LOADER_ACCESS_KEY_ID')
    unless config.secretAccessKey?
      return robot.logger.error('HUBOT_ROLE_LOADER_SECRET_ACCESS_KEY')
    unless config.region?
      return robot.logger.error('HUBOT_ROLE_LOADER_REGION')
    unless config.bucket?
      return robot.logger.error('HUBOT_ROLE_LOADER_BUCKET')
    unless config.key?
      return robot.logger.error('HUBOT_ROLE_LOADER_KEY')
    fetch()
    .then merge
    .catch (e) ->
      robot.logger.error(e)

  robot.brain.on 'loaded', load

  load()
