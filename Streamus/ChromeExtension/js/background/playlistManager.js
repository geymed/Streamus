//Manages an array of Playlist objects.
define(['playlist', 'playlistItem', 'playlistDataProvider', 'user'], function(Playlist, PlaylistItem, playlistDataProvider, user) {
    'use strict';
    var playlists = [];
    var isReady = false;

    var events = {
        onReady: 'playlistManager.onReady'
    };

    user.onLoaded(function () {
        console.log("id:", user.id);
        $.ajax({
            url: 'http://localhost:61975/Playlist/GetPlaylistsByUserId',
            dataType: 'json',
            data: {
                userId: user.id
            },
            success: function (data) {
                console.log("user loaded. data returned:", data);
                //Transform the config items into Backbone.Model before adding to playlist since that is playlist's expected type.
                data.items = _.map(data.items, function (itemConfig) {
                    return new PlaylistItem(itemConfig);
                });
                
                playlists = _.map(data, function (playlistConfig) {
                    return new Playlist(playlistConfig);
                });

                //PlaylistManager will remember the selected playlist via localStorage.
                var savedPosition = JSON.parse(localStorage.getItem('selectedPlaylistPosition'));
                console.log("savedPosition:", savedPosition);
                selectPlaylistByPosition(savedPosition != null ? parseInt(savedPosition) : 0);

                $(document).trigger(events.onReady);
                isReady = true;
            },
            error: function (error) {
                console.error(error);
            }
        });
    }); 
    
    function selectPlaylistByPosition(position) {
        var playlist = getPlaylistByPosition(position);
        if (playlist != null) {
            console.log("playlist at position " + position, playlist);
            setSelectedPlaylist(playlist);
        }
    }
    
    function getPlaylistByPosition(position) {
        return _.find(playlists, function (p) {
            return p.get('position') === position;
        });
    }
    
    function getSelectedPlaylist() {
        var selectedPlaylist = _.find(playlists, function(p) {
             return p.get('selected');
        });
        return selectedPlaylist;
    }
    
    function setSelectedPlaylist(playlistToSelect) {
        var selectedPlaylist = getSelectedPlaylist();
        
        if (selectedPlaylist != null && selectedPlaylist.position != playlistToSelect.position) {
            selectedPlaylist.set('selected', false);
        }
        
        //First time loading up there won't be a playlist selected yet, so just go ahead and set.
        playlistToSelect.set('selected', true);
        localStorage.setItem('selectedPlaylistPosition', playlistToSelect.get('position'));
    }

    return {
        onReady: function (event) {
            if (isReady) {
                event();
            } else {
                $(document).on(events.onReady, event);
            }
        },
        get playlists() {
            return playlists;
        },
        get activePlaylist() {
            return getSelectedPlaylist();
        },
        set activePlaylist(value) {
            console.log("calling setActivePlaylist with value", value);
            setSelectedPlaylist(value);
        },
        //TODO: Probably should convert this to position.
        setActivePlaylistById: function (id) {
            console.log("calling setActivePlaylistById", id);
            var playlist = this.getPlaylistById(id);
            setSelectedPlaylist(playlist);
        },
        getPlaylistById: function(id) {
            return _.find(playlists, function(p) {
                 return p.get('id') === id;
            });
        },
        //Songs is an optional paramater. When adding a playlist from YouTube a collection of songs
        //will be known -- so add them to the playlist during creation. When creating a new playlist
        //directly inside the app there won't be any songs.
        addPlaylist: function (playlistTitle, callback) {
            var playlist = new Playlist({
                title: playlistTitle,
                position: playlists.length,
                userId: user.id
            });
            console.log("adding playlist with userId:", playlist.get('userId'));

            //Save the playlist, but push after version from server because the ID will have changed.
            playlist.save(function () {
                playlists.push(playlist);
                
                if (callback) {
                    callback(playlist);
                }
            });
        },
        removePlaylistById: function (playlistId) {
            console.log("playlist id:", playlistId);
            var playlist = _.find(playlists, function(p) {
                 return p.get('id') === playlistId;
            });
            //Remove from playlists clientside only after server responds with successful delete.
            playlists = _.reject(playlists, function(p) {
                 return p.get('id') === playlistId;
            });
            
            playlist.remove();
        }
    };
});