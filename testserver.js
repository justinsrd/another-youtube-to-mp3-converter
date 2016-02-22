'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var ytdl = require('ytdl-core');
var ffmpeg = require('fluent-ffmpeg');
var port = process.env.PORT || 3001;

app.use(express.static('./testclient'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.post('/api/endpoint', function(req, res) {
  console.log(req.body.keyx);
  var randomTime = Math.round(Math.random() * 1000 * 5);
  setTimeout(function() {
    res.send({ltr: req.body.keyx, time: randomTime});
  }, randomTime);
});

app.listen(port, function() {
  console.log('\nServer is running on port ' + port + '.....\n')
});