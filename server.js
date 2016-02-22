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


app.get('/api/playlist', function(req, res) {
  var thePayload = [];
  request('https://www.youtube.com/playlist?list=PLWrgnHLVEW5uMFrInzbRPltI1w-6uBvrE', function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      //var list = $('tbody tr a');
      var list = $('tbody#pl-load-more-destination').find('tr .pl-video-title-link');
      //console.log(list[2].attribs.href);
      for (var i = 0; i < list.length; i++) {
        console.log(list[i].attribs.href);
        thePayload.push(list[i].attribs.href);
      }
    }
    res.send(thePayload);
  });
});

app.post('/api/tracks', function(req, res) {
  // var startDate = new Date();
  // var url = req.body.url;
  // var stream = ytdl(url);
  // ytdl.getInfo(url, function(err, info) {
  //   var songTitle = info.title.replace(/[\/]/g, '|');
  //   console.log('Downloading ::::: ' + info.title);
  //   stream.pipe(fs.createWriteStream('./output_video/' + songTitle + '.mp4'));
  //   stream.on('end', function() {
  //     console.log('Video finished downloading. Conversion to mp3 starting now.....');
  //     var proc = new ffmpeg({source: './output_video/' + songTitle + '.mp4'}).audioBitrate('320');
  //     proc.save('./output_audio/' + songTitle + '.mp3');
  //     var endDate = new Date();
  //     var totalTime = Math.round((endDate - startDate) / 1000);
  //     console.log('Mp3 conversion finished!')
  //     res.send('Finished converting to mp3! Took ' + totalTime + ' seconds!');
  //   });
  // });
  var startDate = new Date();
  var url = req.body.url;
  var stream = ytdl(url);
  ytdl.getInfo(url, function(err, info) {
    var songTitle = info.title.replace(/[\/]/g, '|');
    console.log('Downloading ::::: ' + info.title);
    stream.pipe(fs.createWriteStream('./output_video/' + songTitle + '.mp4'));
    stream.on('end', function() {
      console.log('Video finished downloading. Conversion to mp3 starting now.....');
      var proc = new ffmpeg({source: './output_video/' + songTitle + '.mp4'}).audioBitrate('320');
      proc.save('./output_audio/' + songTitle + '.mp3');
      var endDate = new Date();
      var totalTime = Math.round((endDate - startDate) / 1000);
      console.log('Mp3 conversion finished!')
      res.send('Finished converting to mp3! Took ' + totalTime + ' seconds!');
    });
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