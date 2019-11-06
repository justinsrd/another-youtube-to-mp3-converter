'use strict';

const app = angular.module('app', ['ui.router']);

app.controller('mainCtrl', ['$state', function($state) {
    $state.go('playlist');
}]);

app.controller('playlistCtrl', ['$scope', 'PlaylistService', function($scope, PlaylistService) {
    $scope.tracks = [];
    $scope.validUrl = false;

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
}]);

app.config(function($stateProvider, $locationProvider) {
    $locationProvider.hashPrefix('');
    $stateProvider
        .state('playlist', {
            url: '/',
            templateUrl: './playlistTemplate.html',
            controller: 'playlistCtrl'
        })
});

app.service('PlaylistService', ['$http', function($http) {
    return {
        getPlaylistInfo: (uri) => $http.get('/api/playlist/' + uri),
        downloadPlaylist: (tracks) => $http.post('/api/download', {tracks: tracks}),
        writeData: (tracks) => $http.post('/api/label', {tracks: tracks})
    }
}]);