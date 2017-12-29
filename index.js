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
// maps
app.get('/map/:mapType*?', function(req, res) {
  var mapType = req.params.mapType
  if (typeof mapType == 'undefined'){
    mapType = 'default'
  }
  //debug('which map is it??? ',req.params,mapType)
  // lookup locations
  var googleMapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_MAPS_KEY
  });
  // Geocode a list of address. Some need it and others do not.
  // load the addresses from the db
  var maxAddressesToGeocodeAtOnce = 3,
    addressesCombined = []

  // add all that do not need geocoding to output array and queue up all that do need geocoding
  getAddresses(function onAddressesLoad(loadErr, addresses){
    var addressesToLookup = [],
      i, l=addresses.length
    for(i=0;i<l;i++){
      if (isNaN(parseFloat(addresses[i].lat)) || isNaN(parseFloat(addresses[i].lng))){
        // these need to be looked up
        // there is a limit so only do a certain amount
        // save the results back so we dont have to do it again later
        if (addressesToLookup.length < maxAddressesToGeocodeAtOnce){
          addressesToLookup.push(addresses[i])
        } else {
          debug(chalk.blue('TOO many to lookup - excluding this one!!!'),addresses[i])
        }
      } else {
        // this one is good
        addressesCombined.push(addresses[i])
      }
    }
    //debug(chalk.red('lookup these addresses'),addressesToLookup)
    // geocode any that need it
    // finally, send the output to the renderer
    async.each(addressesToLookup, (addressObj, next) => {
        //debug('geocode this one',addressObj)
        googleMapsClient.geocode({
          address: addressObj.address
        }, function(err, response) {
          if (err) {
            debug('Error with geocode call',err)
          }
          //debug('geocoding results', response)
          if (response.json.status === 'OK'){
            var results = response.json.results
            //debug('raw results',results)
            l=results.length
            for(i=0;i<l;i++){
              //debug('result ' + i,results[i])
              //debug('location ',results[i].geometry.location)
              addressesCombined.push({
                title: addressObj.title,
                lat: results[i].geometry.location.lat,
                lng: results[i].geometry.location.lng,
                address: results[i].formatted_address,
                place_id: results[i].geometry.place_id,
                description: addressObj.description
              })
            }
            // TODO: save this data to the database too!
            next()

          } else {
            // problem - details here: https://developers.google.com/maps/documentation/geocoding/intro#geocoding
            debug('non OK response returned!',response.json.status)
            next(new Error('Geocoding response was not OK ' + response.json.status))
          }
        })  // googleMapsClient.geocode


    }, (err) => {
      if (err){
        debug('an error happened during geocoding!',err)
      }
      //debug('everything finished geocoding')
      var data = user
      data.map = {
        key: process.env.GOOGLE_MAPS_KEY,
        type: mapType,
        locations: addressesCombined,
        locations_stringified: JSON.stringify(addressesCombined)
      }
      res.render('map', data)
    })

  })  // onAddressesLoad
})
// search
app.get('/search/:term/:page*?', function(req, res) {
  var term = req.params.term
  var page = req.params.page
  if (typeof page == 'undefined'){
    page = 1
  }
  page = parseInt(page)
  // more option parameters here
  // https://developers.google.com/custom-search/json-api/v1/reference/cse/list#parameters
  var searchOptions = {
    page: page
  }

  debug(chalk.red('>>>>>>>>>>>>>>>>>>>>>>>>> search with optional params '), term, page)
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

// simulating a call to a database
// replace with a db call later on!
function getAddresses(callback){
  var addressesToLookup = [
    {
      address: '1600 Amphitheatre Parkway, Mountain View, CA',
      lat: '37.4224082',
      lng: '-122.0856086',
      title: 'Google Building 41',
      place_id: '',
      description: 'Longer text goes here'
    },
    {
      address: '959 Eden Ave SE, Atlanta, GA',
      lat: '',
      lng: '',
      title: 'Home',
      place_id: '',
      description: 'Longer text goes here'
    },
    {
      address: '14th St SW, Largo, FL 33770',
      lat: '',
      lng: '',
      title: 'Florida home!',
      place_id: '',
      description: 'Wow, this is where I grew up!'
    },
    {
      address: '11650 Alpharetta Highway, Roswell, GA',
      lat: '',
      lng: '',
      title: 'The Roswell Office',
      place_id: '',
      description: 'Its the office'
    },
    {
      address: 'Holiday Inn Express, 210 Seminole Blvd, Largo, FL 33770',
      lat: '',
      lng: '',
      title: 'Holiday Inn in Largo',
      place_id: '',
      description: 'Longer text goes here'
    }
  ]
  callback(null, addressesToLookup)
}
