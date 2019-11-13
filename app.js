'use strict';

const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const NodeID3 = require('node-id3');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const uuidv4 = require('uuid/v4');
const port = process.env.PORT || 3000;
const GOOGLE_API_URL = 'https://www.googleapis.com/youtube/v3/videos';
const YOUTUBE_PREFIX_URL = 'https://www.youtube.com/watch?v=';
let ytApiKey;

const jobs = [];

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

if (!process.env.YT_API_KEY) {
	throw 'YT_API_KEY Not Found';
} else {
	ytApiKey = process.env.YT_API_KEY;
}




app.post('/jobs', function(req, res) {
	console.log('bod', req.body);
	const jobId = enqueueJob(req.body.tracks);
	res.status(200).send(jobId);
});

function enqueueJob(tracks) {
	if (tracks && tracks.length) {
		const jobId = uuidv4();
		jobs.push({
			uuid: jobId,
			tracks: tracks,
			completed: 0,
			total: tracks.length,
			complete: false,
			inProgress: false
		});
		processNewJob();
		return jobId;
	}
}

function processNewJob() {
	const unprocessedJobs = jobs.filter((job) => {
		return job.inProgress === false && job.complete === false;
	});
	const job = unprocessedJobs[0];
	if (job) {
		job.inProgress = true;
		const tracks = job.tracks;
		tracks.forEach((track) => {
			track.label = track.label.replace(/[\/]/g, '|');
			// console.log(track.label);
			// console.log(track.link);
			// console.log(track.artist);
			// console.log(track.title);
			// console.log(track.album);
			// console.log(track.genre);
		});

		function download() {
			const song = tracks.shift(); //todo replace with filter
			if (song) {
				const start = new Date();
				const songTitle = song.label;
				console.log('Starting download for ' + songTitle);

				if (fs.existsSync(videoOutputPath + songTitle + '.mp4')) {
					fs.unlinkSync(videoOutputPath + songTitle + '.mp4');
					console.log('unlink ' + songTitle + '.mp4 done');
				}

				if (fs.existsSync(audioOutputPath + songTitle + '.mp3')) {
					fs.unlinkSync(audioOutputPath + songTitle + '.mp3');
					console.log('unlink ' + songTitle + '.mp3 done');
				}

				const stream = ytdl(song.link, {filter: 'audioonly'});
				stream.pipe(fs.createWriteStream(videoOutputPath + songTitle + '.mp4'));

				stream.on('error', function(error) {
					console.log('Error downloading song ' + songTitle, error);
				});

				stream.on('end', function() {
					console.log('ENDEDENDEDENDED');
					const command = ffmpeg({source: videoOutputPath + songTitle + '.mp4'}).audioBitrate(320);
					command.save(audioOutputPath + songTitle + '.mp3');
					setTimeout(() => {
						writeID3Tags(song);
						const time = Math.round((new Date() - start) / 1000);
						console.log(`Time: ${time} seconds! [${songTitle}]\n`);

						job.completed++;
						if (tracks.length === 0) {
							job.complete = true;
							console.log('Job ' + job.uuid + ' complete! ' + job.total + ' tracks downloaded.');
							job.inProgress = false;
							processNewJob();
						} else {
							download();
						}
					}, 5000);

				});
			}
		}
		console.log('\n\nDownload beginning >>>');
		download();
	}
}




// ingests url links with YT video ids, returns titles
// req.body.tracks = ['TjtyJnokTEA', 'SufAKh_bHsU', 'JZKaVjAYjXo']
app.post('/api/metadata', async function(req, res) {
	const tracks = req.body.tracks || ['yQsykOujFCI', 'fWbeSS8G_wY'];
	const trackInfoDict = {};

	for (let track of tracks) {
		try {
			const url = `${GOOGLE_API_URL}?part=snippet&key=${ytApiKey}&id=${track}`;
			const response = await fetch(url);
			trackInfoDict[track] = await response.json();
		} catch (e) {
			console.log('Error fetching track metadata', e);
		}
	}
	res.json(trackInfoDict);
});

app.get('/jobs', function(req, res) {
	res.json({jobs: jobs});
});

app.get('/jobs/:jobId', function(req, res) {
	const jobId = req.params.jobId;
	const job = jobs.filter((job) => job.uuid === jobId);
	res.json({job: job ? job[0] : null});
});




function writeID3Tags(track) {
	const tags = {
        artist: track.artist,
        title: track.title,
		album: track.album
	};
	NodeID3.update(tags, audioOutputPath + track.label + '.mp3');
}

//------------------- POST /metadata
//------------------- POST /jobs
//------------------- GET /jobs (should actually be /jobs/:user, but whatever)
//------------------- GET /jobs/:jobId




app.listen(port, () => console.log(`Server started on port ${port}\n`));
