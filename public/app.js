'use strict';

const app = angular.module('app', ['ui.router']);

app.controller('mainCtrl', ['$state', function($state) {
    $state.go('playlist');
}]);

app.controller('playlistCtrl', ['$scope', 'PlaylistService', function($scope, PlaylistService) {
    $scope.tracks = [];
    $scope.b = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j'];
    $scope.validUrl = false;

    // $scope.u = 'https://www.youtube.com/watch?v=ne43u8suEAg';
    $scope.u = 'cchlCNlJUXw';

    $scope.getPlaylistInfo = function(url) {
        const delimiter = '?list=';
        const uriIdx = url.indexOf(delimiter);
        if (uriIdx > -1) {
            const uri = url.slice(uriIdx + delimiter.length);
            PlaylistService.getPlaylistInfo(uri).then(function(res) {
                console.log('playlist response', res.data);
                $scope.tracks = res.data;
            });
        } else {
            console.error('Invalid playlist url');
        }
    }

    $scope.showId3Data = function() {
        console.log($scope.tracks);
    };

    $scope.download = function() {
        PlaylistService.downloadPlaylist($scope.tracks);
    }

    $scope.writeData = function() {
        PlaylistService.writeData($scope.tracks);
    }


    $scope.go = function() {
        console.log('scope.u', $scope.u);
        PlaylistService.getMetaData($scope.u).then((res) => {
            console.log('metadata res', res);
        }, (err) => {
            console.log('metadata err', err);
        });
    }

    $scope.customDl = function() {
        PlaylistService.downloadPlaylist([{label: 'dota', link: 'https://www.youtube.com/watch?v=lp-EO5I60KA'}]);
    }

    $scope.id3 = function() {
        PlaylistService.id3().then((res) => {
            console.log('id3 res', res);
        }, (err) => {
            console.log('id3 err', err);
        });
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
        downloadPlaylist: (tracks) => $http.post('/api/download', {tracks: tracks}),
        writeData: (tracks) => $http.post('/api/label', {tracks: tracks}),



        getMetaData: (track) => $http.post('/metadata', {track: track}),
        id3: () => $http.post('/id3', {}),
    }
}]);