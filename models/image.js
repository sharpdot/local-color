/*
 * image model class
 */

const db = require('./db'),
  moment = require('moment');

const debug = require('debug')('localcolor')

/*
 * Image Constructor
 *
 * data should always come from lcol_images
 */
var Image = function(data) {
  this.id = 0
  this.url = ''
  this.jsondata = JSON.stringify({})
  this.status = 1
  this.localpath = ''
  if (typeof data !== 'undefined'){
    this.init(data)
  }
  return this
}

/*
 * init properties from a data object or sql row
 */
Image.prototype.init = function(data) {
  if (typeof data.id !== 'undefined'){
    this.id = data.id
  }
  if (typeof data.url !== 'undefined'){
    this.url = data.url
  }
  if (typeof data.jsondata !== 'undefined'){
    this.jsondata = JSON.stringify(data)
  }
  if (typeof data.status !== 'undefined'){
    this.status = data.status
  }
  if (typeof data.localpath !== 'undefined'){
    this.localpath = data.localpath
  }
}

/*
 * fetch
 * pass in an id
 * or pass in a key value pair to search on
 */
Image.prototype.fetch = function(search, callback) {
  if (typeof search === 'undefined'){
    throw new Error('No search criteria')
    return
  }
  // convert id to object format
  if (typeof search === 'number'){
    seach = { id: parseInt(search) }
  }
  if (typeof search !== 'object'){
    throw new Error('Invalid search criteria')
    return
  }
  // work from the search object
  var sql = 'SELECT * FROM lcol_images where ',
    where = '',
    params = []
  for (var col in search){
    if (where != ''){
      where += ' AND '
    }
    if (search[col] === null){
      where += col + ' is NULL'
    } else {
      where += col + ' = ?'
      params.push(search[col])
    }
  }
  // ONLY FIND 1 record
  sql += where + ' LIMIT 0, 1'
  // NOTE: using arrow function preserves this
  db.query( sql, params, ( err, rows ) => {
    if (err){
      throw err
      return
    }
    if (rows.length > 0){
      this.init(rows[0])
    }
    if (typeof callback !== 'undefined'){
      callback(err)
    }
  });
}

// update or insert
Image.prototype.save = function(callback) {
  var sql = '',
    params = [],
    now = moment().format('YYYY-MM-DD HH:mm:ss')
  if (this.id){
    sql = "UPDATE lcol_images SET url = ?, status = ?, jsondata = ?, localpath = ?, updated = ? WHERE id = ?"
    params = [this.url, this.status, this.jsondata, this.localpath, now, this.id]
  } else {
    sql = "INSERT INTO lcol_images (`url`, `status`, `jsondata`, `localpath`, `created`, `updated`) VALUES (?, ?, ?, ?, ?, ?)"
    params = [this.url, this.status, this.jsondata, NULL, now, now]
  }
  debug('try to save now',sql,params)
  db.query( sql, params, function( err, rows ) {
    debug('got save result',err, rows)
    callback(err)
  });
}

Image.prototype.delete = function(callback) {
  callback('not implemented')
}

module.exports = Image;
