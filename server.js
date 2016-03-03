'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var ytdl = require('ytdl-core');
var ffmpeg = require('fluent-ffmpeg');
var request = require('request');
var cheerio = require('cheerio');
var port = process.env.PORT || 3001;

app.use(express.static('./public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.post('/api/single', function(req, res) {
  ytdl.getInfo(req.body.url, function(err, info) {
    res.send({title: info.title, url: req.body.url});
  });
});

app.post('/api/playlist', function(req, res) {
  var resultPlaylist = [];
  var plUrl = req.body.url
  request(plUrl, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var list = $('tbody#pl-load-more-destination').find('tr .pl-video-title-link');
      for (var i = 0; i < list.length; i++) {
        //resultPlaylist.push(list[i].attribs.href);
        var songUrl = list[i].attribs.href;
        ytdl.getInfo(songUrl, function(err, info) {
          resultPlaylist.push({ title: info.title, url:songUrl });
          if (resultPlaylist.length === list.length) {
            res.send(resultPlaylist);
          }
        });
      }
    } else {
      console.log(error);
      console.log(response.statusCode);
      res.send('Invalid input!')
    } 
  });
});

app.post('/api/download', function(req, res) {
  var startDate = new Date();
  var url = req.body.url;
  var stream = ytdl(url);
  var audioOutputPath = './output_audio/';
  var videoOutputPath = './output_video/';

  if (!fs.existsSync(audioOutputPath)) {
      fs.mkdirSync(audioOutputPath);
  }
  if (!fs.existsSync(videoOutputPath)) {
      fs.mkdirSync(videoOutputPath);
  }

  ytdl.getInfo(url, function(err, info) {
    var songTitle = info.title.replace(/[\/]/g, '|');
    //console.log(info);
    if(fs.existsSync(audioOutputPath+songTitle+'.mp3')) {
      res.send('Song already exists!');
      //res.json(info);
    } else {
      //console.log('Downloading ::::: ' + info.title);
      stream.pipe(fs.createWriteStream(videoOutputPath + songTitle + '.mp4'));
      stream.on('end', function() {
        //console.log('Video finished downloading. Conversion to mp3 starting now.....');
        var proc = new ffmpeg({source: videoOutputPath + songTitle + '.mp4'}).audioBitrate('320');
        proc.save(audioOutputPath + songTitle + '.mp3');
        var endDate = new Date();
        var totalTime = Math.round((endDate - startDate) / 1000);
        //console.log('Mp3 conversion finished!')
        res.send('Finished converting to mp3 in ' + totalTime + ' seconds!');
      });
    }
  });
});

app.delete('/api/videos', function(req, res) {
  var url = req.body.url;
  ytdl.getInfo(url, function(err, info) {
    var songTitle = info.title.replace(/[\/]/g, '|');
    fs.unlink('./output_video/' + songTitle + '.mp4');
    res.send('Song was deleted!');
  });
})

app.listen(port, function() {
  console.log('\nServer is running on port ' + port + '.....\n')
});