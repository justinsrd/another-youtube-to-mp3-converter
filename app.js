'use strict';

const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const NodeID3 = require('node-id3');
const ffmpeg = require('fluent-ffmpeg');
// let command = ffmpeg();
const cheerio = require('cheerio');
const request = require('request');
const ytdl = require('ytdl-core');
const port = process.env.PORT || 3000;

app.use(express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const audioOutputPath = './output_audio/';
const videoOutputPath = './output_video/';
if (!fs.existsSync(audioOutputPath)) {
	fs.mkdirSync(audioOutputPath);
}
if (!fs.existsSync(videoOutputPath)) {
	fs.mkdirSync(videoOutputPath);
}

app.get('/api/playlist/:url', function(req, res) {
	const playlistInfo = [];
	const url = req.params.url;
	request('https://www.youtube.com/playlist?list=' + url, function(error, response, html) {
		if (!error && response.statusCode === 200) {
			const $ = cheerio.load(html);
			const titles = $('tbody#pl-load-more-destination tr.pl-video');
			const links = titles.find('a.pl-video-title-link');

			if (titles.length === links.length) {
				for (let i = 0; i < titles.length; i++) {
					playlistInfo.push({
						label: titles[i].attribs['data-title'],
						link: 'https://youtube.com' + links[i].attribs.href
					});
				}
			}
			res.json(playlistInfo);
		} else {
			res.json({});
		}
	});
});

app.post('/api/download', function(req, res) {
	downloadPlaylist(req, res);
});

function downloadPlaylist(req, res) {
	const tracks = req.body.tracks || [];
	tracks.forEach((track) => {
        console.log(track.label);
        console.log(track.link);
    });

	function download() {
		const song = tracks.shift();
		if (song) {
			const start = new Date();
			const songTitle = song.label.replace(/[\/]/g, '|');
			console.log('starting dl for ' + songTitle);
			if (!fs.existsSync(audioOutputPath + songTitle + '.mp3')) {
				const stream = ytdl(song.link, {filter: 'audioonly'});
				stream.pipe(fs.createWriteStream(videoOutputPath + songTitle + '.mp4'));
				stream.on('end', function() {
					const command = ffmpeg({source: videoOutputPath + songTitle + '.mp4'}).audioBitrate(320);
					command.save(audioOutputPath + songTitle + '.mp3');
					// console.log('\n\nwaiting7\n');
                    // demo();
                    // console.log('\n\nend waiting7\n');
					// writeID3Tags(song, songTitle);
					const time = Math.round((new Date() - start) / 1000);
					console.log(`time: ${time} seconds! [${songTitle}]\n`);
					if (tracks.length === 0) {
						console.log('done!');
						res.json({ye: 'yee'});
					} else {
						download()
					}

				});
			}
		}	
	}
    console.log('\n\nDownload beginning>>>');
	download();
}

app.post('/api/label', function(req, res) {
    label(req, res);
});

function label(req, res) {
    const tracks = req.body.tracks || [];
    tracks.forEach((track) => {
        const songTitle = track.label.replace(/[\/]/g, '|');
        writeID3Tags(track, songTitle);
	});
    res.json({success: true})
}



function writeID3Tags(song, songTitle) {
	const tags = {
        artist: song.artist,
        title: song.title,
		album: song.album
	};
    console.log('song', song);
	console.log('tags', tags);
	const success = NodeID3.update(tags, audioOutputPath + songTitle + '.mp3');
	console.log('success!', success);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
    console.log('Taking a break...');
    await sleep(7000);
    console.log('Two second later');
}



app.listen(port, () => console.log(`Server started on port ${port}\n`));
