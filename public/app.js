'use strict';

var currentPlaylist;
var currentSingle;

$('#get-single').click(function() {
  $.ajax({
    type: 'POST',
    url: '/api/single',
    data: {url: $('#url-single').val()},
    success: function(response) {
      console.log(response);
      currentSingle = response;
      document.getElementById('infobox-single').textContent = '';
      var el = document.createElement('p');
      el.textContent = response.title;
      document.getElementById('infobox-single').appendChild(el);
    }
  });
});

$('#download-single').click(function() {
  $.ajax({
    type: 'POST',
    url: '/api/download',
    data: {url: 'https://youtube.com' + currentSingle.url},
    success: function(response) {
      alert(response);
    }
  });
});

$('#get-playlist').click(function() {
  $.ajax({
    type: 'POST',
    url: '/api/playlist',
    data: {url: $('#url-playlist').val()},
    success: function(response) {
      console.log(response);
      currentPlaylist = response;
      document.getElementById('infobox-playlist').textContent = '';
      for (var i = 0; i < response.length; i++) {
        var el = document.createElement('p');
        el.textContent = response[i].title;
        document.getElementById('infobox-playlist').appendChild(el);
      }
    }
  })
});

$('#download-playlist').click(function() {
  for (var i = 0; i < currentPlaylist.length; i++) {
    $.ajax({
      type: 'POST',
      url: '/api/download',
      data: {url: 'https://youtube.com' + currentPlaylist[i].url},
      async: false,
      success: function(response) {
        console.log(response);
      }
    });
  }
  alert('Playlist finished downloading!');
});