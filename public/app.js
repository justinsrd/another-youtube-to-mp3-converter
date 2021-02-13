'use strict';

const app = angular.module('app', ['ui.router']);

app.controller('mainCtrl', ['$state', function($state) {
    $state.go('playlist');
}]);

app.controller('playlistCtrl', ['$scope', 'PlaylistService', function($scope, PlaylistService) {
    $scope.tracks = [];
    $scope.switchy = false;
    $scope.urlInput = '';
    let trackIds = [];
    $scope.genres = [
        'Alternative',
        'Chill',
        'Country',
        'Dubstep',
        'EDM',
        'Hip-Hop',
        'Indie',
        'Lifted',
        'New Indie',
        'Other',
        'Pop',
        'Rock',
        'Soundtrack',
        'Techno'
    ];

    // $scope.getPlaylistInfo = (url) => {
    //     const delimiter = '?list=';
    //     const uriIdx = url.indexOf(delimiter);
    //     if (uriIdx > -1) {
    //         const uri = url.slice(uriIdx + delimiter.length);
    //         PlaylistService.getPlaylistInfo(uri).then((res) => {
    //             console.log('playlist response', res.data);
    //             $scope.tracks = res.data;
    //         });
    //     } else {
    //         console.error('Invalid playlist url');
    //     }
    // }

    function validateUrls() {
        if (!$scope.urlInput) {
            return;
        }
        const tracks = $scope.urlInput.split('\n');
        trackIds = tracks.map((track) => {
            return track.split('v=')[1].split('&')[0];
        });
    }

    $scope.initEditForm = function() {
        validateUrls();
        PlaylistService.getMetaData(trackIds).then((res) => {
            console.log('resdata', res.data);
            var arr = [];
            for (var videoId in res.data) {
                var videoObj = res.data[videoId];
                if (videoObj.pageInfo.totalResults !== 0) {
                    videoObj.items[0].link = 'https://www.youtube.com/watch?v=' + videoId;
                    arr.push(videoObj.items[0]);
                } else {
                    console.log('Couldn\'t find video for ' + videoId);
                }
            }
            $scope.tracks = arr;
            $scope.switchy = true;
        }, (err) => {
            console.log('Metadata error', err);
        });
    }

    $scope.beginDownload = function() {
        PlaylistService.startDownload($scope.tracks.map((track) => {
            const trackInfo =  {
                label: `${track.artist} - ${track.title}`,
                artist: track.artist,
                title: track.title,
                album: track.album,
                genre: track.genre,
                link: track.link
            };
            if (track.commentStr) {
                trackInfo.comment = {
                    language: 'eng',
                    shortText: undefined,
                    text: track.commentStr
                }
            }
            return trackInfo;
        }));
    }

    // $scope.id3 = function() {
    //     PlaylistService.id3().then((res) => {
    //         console.log('id3 res', res);
    //     }, (err) => {
    //         console.log('id3 err', err);
    //     });
    // }

    $scope.check = function() {
        var ok = true;
        for (let i = 0; i < $scope.tracks.length; i++) {
            const track = $scope.tracks[i];
            track.checked = true;
            if (!track.title || !track.artist || !track.album || !track.genre) {
                ok = false;
                break;
            }
        }
        if (ok) {

        } else {

        }
    }

    $scope.clearAll = function() {
        for (let i = 0; i < $scope.tracks.length; i++) {
            $scope.tracks[i].checked = false;
        }
    }

    $scope.bulkUpdate = function(property, value) {
        if (value !== undefined) {
            if (property === 'genre') {
                $scope.tracks.forEach((track) => {
                    track.genre = value;
                });
            } else if (property === 'comment') {
                $scope.tracks.forEach((track) => {
                    track.commentStr = value;
                });
            }
        }
    }
}]);

app.config(function($stateProvider, $locationProvider) {
    $locationProvider.hashPrefix('');
    $stateProvider
        .state('playlist', {
            url: '/',
            templateUrl: './playlist.html',
            controller: 'playlistCtrl'
        })
});


app.service('PlaylistService', ['$http', function($http) {
    return {
        getPlaylistInfo: (uri) => $http.get('/api/playlist/' + uri),
        startDownload: (tracks) => $http.post('/jobs', {tracks: tracks}),
        writeData: (tracks) => $http.post('/api/label', {tracks: tracks}),
        getMetaData: (tracks) => $http.post('/api/metadata', {tracks: tracks}),
        id3: () => $http.post('/id3', {}),
    }
}]);