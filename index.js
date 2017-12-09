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
  hbs = require('express-hbs'),
  chalk = require('chalk'),
  async = require('async'),
  ColorThief = require('color-thief'),
  _ = require('lodash'),
  path = require('path'),
  fs = require('fs'),
  models = require('./models/index'),
  name = "localcolor"

debug(chalk.blue(`starting ${name}`))

const IMG_SAVE_DIR = path.join(process.cwd(), 'images-to-process')
// make sure the save directory exists
createFolder(IMG_SAVE_DIR)

// config handlebars
app.set('view engine', 'hbs')
app.engine('hbs', hbs.express4({
  defaultLayout: __dirname + '/views/layouts/main.hbs',
  partialsDir: __dirname + '/views/partials',
  layoutsDir: __dirname + '/views/layouts'
}))
app.set('views', path.join(__dirname,'/views'))

var user = {
  first: 'Jeremy',
  last: 'Dost',
  site: 'http://jeremydost.com',
  age: 32
}

app.get('/', function(req, res) {
  res.render('index', user)
})
// search
app.get('/search/:term/:page*?', function(req, res) {
  var term = req.params.term
  var page = req.params.page
  if (typeof page == 'undefined'){
    page = 1
  }
  // more option parameters here
  // https://developers.google.com/custom-search/json-api/v1/reference/cse/list#parameters
  var searchOptions = {
    page: page,
    imgType: "photo",
    num: 3
  }

  debug('search with optional params ', term, page)
  var resultImages = []

  //debug('body....', req.params)
  const GoogleImages = require('google-images')
  const client = new GoogleImages(process.env.CSE_ID, process.env.CSE_API_KEY)
  client.search(term, searchOptions)
      .then(images => {
          // save and download
          async.each(images, (imageJson, next) => {
            //debug('handle image',imageJson)
            // insert into db
            // TODO: first check to see if it is already there?
            imageJson.id = 0
            var imgObj = new models.Image(imageJson)
            // download and save locally
            // fix path to not include query string params...
            var fileExt = path.extname(imgObj.url)
            var regex = /[#\\?]/g; // regex of illegal extension characters
            var endOfExt = fileExt.search(regex);
            if (endOfExt > -1) {
                fileExt = fileExt.substring(0, endOfExt);
            }
            const uuidv1 = require('uuid/v1')
            var fileName = uuidv1() + fileExt // fileExt includes the dot
            var savePath = path.join(IMG_SAVE_DIR, fileName)
            //debug('save path', savePath)
            downloadFile((err) => {
              debug('downloaded the file', fileExt, fileName, savePath, imgObj.url)
              imgObj.localpath = savePath

              //
              var newData = JSON.parse(imgObj.jsondata)
              newData.term = term
              newData.page = page
              newData.colors = []
              try {
                // set the localpath and save - indicates that it was downloaded
                var colorThief = new ColorThief()
                newData.colors = colorThief.getPalette(savePath, 8)
                //debug('got the palette....',palette)
              } catch (e) {
                debug(chalk.red('exception! ' + e))
              }

              //
              var ExifImage = require('exif').ExifImage;

              try {
                  new ExifImage({ image : savePath }, function (error, exifData) {
                      if (error){
                          console.log('Error: '+error.message);
                      }
                      if (typeof exifData !== 'undefined'){
                        //debug(chalk.white('exif data'), exifData)
                        if (!_.isEmpty(exifData.gps)){
                            debug(chalk.white('exif GPS data!'), exifData.gps)
                        }
                    }
                          newData.exif = exifData

                          imgObj.jsondata = JSON.stringify(newData)

                          imgObj.save(function onDone(err, result){
                            //debug('saved!!!!!')
                            resultImages.push(imgObj)
                            next()
                          })

                  });
              } catch (error) {
                  debug('Error: ' + error.message);
                  imgObj.jsondata = JSON.stringify(newData)

                  imgObj.save(function onDone(err, result){
                    //debug('saved!!!!!')
                    resultImages.push(imgObj)
                    next()
                  })

              }


            },imgObj.url,savePath)
            // end
          }, (err) => {
            if (err){
              debug('an error happened!',err)
            }
            //debug('everything finished')

            var results = {
              term: term,
              page: page,
              prevPageUrl: (page > 1) ? '/search/' + term + '/' + (page-1) : '',
              nextPageUrl: '/search/' + term + '/' + (page+1),
              images: resultImages,
              first: 'Jeremy',
              last: 'Dost',
              site: 'http://jeremydost.com',
              age: 32
            }

            res.render('results', results)
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
