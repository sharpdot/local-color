"use strict"

/*
local color
1. get images
2. process images
3. display results
*/

require('dotenv').config()

const express = require('express')
const app = express(),
  debug = require('debug')('localcolor'),
  chalk = require('chalk'),
  async = require('async'),
  path = require('path'),
  fs = require('fs'),
  models = require('./models/index'),
  name = "localcolor"

debug(chalk.blue(`starting ${name}`))

var IMG_SAVE_DIR = path.join(process.cwd(), 'images-to-process')
// make sure the save directory exists
createFolder(IMG_SAVE_DIR)
debug('folder there????',IMG_SAVE_DIR)

// download and save the next image that has not been downloaded before!
var img = new models.Image()
img.fetch({ localpath: null }, () => {
  debug(chalk.yellow('returned!'))
  if (img.id){
    debug(chalk.yellow('loaded image!!!!'),img.id,img.url)

    var fileExt = img.url.substring(img.url.lastIndexOf('.') + 1)
    if (fileExt.indexOf('?') > -1){
      fileExt = fileExt.substring(0, fileExt.indexOf('?'))
    }
    var savePath = path.join(IMG_SAVE_DIR, img.id + '.' + fileExt)
      debug('save path', savePath)
    downloadFile((err) => {
      debug('downloaded the file!', err)
      // set the localpath and save - indicates that it was downloaded
      img.localpath = savePath
      img.save(function onDone(err, result){
        debug('updated!!!!!')
      })
    },img.url,savePath)


  }
})
//

// update



app.get('/get-images', function (req, res) {
  // get stuff
  var output = 'get images'
  debug(output)

  var imageSearchObj = 'baby faces'

  const GoogleImages = require('google-images')
  const client = new GoogleImages(process.env.CSE_ID, process.env.CSE_API_KEY)
  // TODO: search is a parameter?
  client.search(imageSearchObj)
      .then(images => {
          debug('got ' + images.length + ' images')
          output += ' got images ' + images.length
          // save and download
          async.each(images, (image, next) => {
            debug('handle image',image)
            output += ' save and download an image ' + image.url
            // insert into db
            // TODO: first check to see if it is already there?
            image.id = 0
            //
            var img = new models.Image(image)
            img.save(function onDone(err, result){
              debug('saved!',result)
              // now download and save locally
              // fix path to not include query string params...
              var fileExt = img.url.substring(img.url.lastIndexOf('.') + 1)
              if (fileExt.indexOf('?') > -1){
                fileExt = fileExt.substring(0, fileExt.indexOf('?'))
              }
              var savePath = path.join(IMG_SAVE_DIR, img.id + '.' + fileExt)


                debug('save path', savePath)
              downloadFile((err) => {
                debug('downloaded the file!', err)
                // set the localpath and save - indicates that it was downloaded
                img.localpath = savePath
                img.save(function onDone(err, result){
                  debug('updated!!!!!')
                  next()
                })
              },img.url,savePath)
            })
          }, (err) => {
            if (err){
              debug('an error happened!',err)
              output += ' error! ' + err
            }
            output += ' all done now '
            debug('everything finished')
            res.send(output)
          })
          /*
          // update
          var img = new models.Image()
          img.fetch({ url: 'https://static.photocdn.pt/images/articles/2017/04/28/iStock-516651882.jpg' }, () => {
            debug(chalk.yellow('returned!'))
            if (img.id){
              debug(chalk.yellow('loaded image!!!!'),img.id,img.url)
            }
          })
          */


      })


      /* this worked too
      var imageSearch = require('node-google-image-search');

      var results = imageSearch('landscape', callback, 0, 5);

      function callback(images) {
        debug('got images finally', images)
        output += ' got ' + images.length + ' images'
        res.send(output)
      }
      */

})

/**
* download the file
* TODO: handle a 403 error like at this url: http://themindcircle.com/wp-content/uploads/2016/12/mind-bendin-landscape-architecture-1.jpg
*/
function downloadFile(onDownloadComplete,fullUrl,savePath){
		debug(chalk.green('-------------- download this file'),fullUrl,savePath);
			var file = fs.createWriteStream(savePath);
			var protocolModule;
			if (fullUrl.indexOf('https:') === 0){
				protocolModule = require('https');
			} else {
				protocolModule = require('http');
			}
			var request = protocolModule.get(fullUrl, function(response)  {
				response.pipe(file).on('close', function(err) {
					if (err){
            throw new Error('Error downloading file ' + err)
          }
					onDownloadComplete(null, savePath);
				});
		})
}

/*
 * create a directory
*/
function createFolder(dir){
	if (!fs.existsSync(dir)){
		try{
		fs.mkdirSync(dir)
		}catch(e){
			throw new Error("failed to create directory " + dir)
		}
	}
}


app.use('/', express.static(path.join(__dirname, 'public')))

app.listen(5000)

var isSet = function(v,d){
  return (typeof v !== 'undefined') ?  v : d
}

//
var processImages = function(images, how) {
  images = isSet(images, [])
  how = isSet(how, 'default')
  debug(chalk.red(`process images here ${how}`))
  return images
}

var displayResults = function(which, where, source){
  which = isSet(which, 'all')
  where = isSet(where, 'all')
  source = isSet(source, 'all')
  return 'the images are not ready'
}
