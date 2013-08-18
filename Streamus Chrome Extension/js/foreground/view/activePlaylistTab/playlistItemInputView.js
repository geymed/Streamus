//  The videos tab header. Users may add videos by clicking on Add Videos.
//  Clicking Add Videos will allow the user to either search w/ auto-complete suggestions, or to paste youtube URLs into the input.
define([
    'contentHeaderView',
    'youTubeDataAPI',
    'utility',
    'dialog',
    'dialogView'
], function (ContentHeaderView, YouTubeDataAPI, Utility, Dialog, DialogView) {
    'use strict';
    
    var PlaylistItemInputView = Backbone.View.extend({
        
        contentHeaderView: null,
        
        events: {
          
            'input .addInput': 'showVideoSuggestions',
            'paste drop .addInput': 'parseUrlInput',
            'focus .addInput': 'searchIfNotEmpty'

        },
        
        initialize: function () {
            var self = this;

            this.contentHeaderView = new ContentHeaderView({
                model: this.model,
                buttonText: 'Add Video',
                inputPlaceholderText: 'Search or Enter YouTube video URL',
                expanded: true
            });
            
            $('#HomeContent').prepend(this.contentHeaderView.render().el);
            
            //  Provides the drop-down suggestions and video suggestions.
            this.contentHeaderView.enableAutocompleteOnUserInput({
                autoFocus: true,
                source: [],
                position: {
                    my: "left top",
                    at: "left bottom"
                },
                //  minLength: 0 allows empty search triggers for updating source display.
                minLength: 0,
                focus: function () {
                    //  Don't change the input as the user changes selections.
                    return false;
                },
                select: function (event, ui) {
                    //  Don't change the text when user clicks their video selection.
                    event.preventDefault();
                    self.contentHeaderView.clearUserInput();
                    self.model.addItemByInformation(ui.item.value);
                }
            });
            
            
        },
        
        changeModel: function(newModel) {
            this.model = newModel;
            this.contentHeaderView.changeModel(newModel);

        },
        
        //  Searches youtube for video results based on the given text.
        showVideoSuggestions: function () {
            var self = this;
            
            var searchText = this.contentHeaderView.getUserInput();

            var trimmedSearchText = $.trim(searchText);

            //  Clear results if there is no text.
            if (trimmedSearchText === '') {

                this.contentHeaderView.setAutocompleteSource([]);

            } else {
                YouTubeDataAPI.search(trimmedSearchText, function (videoInformationList) {

                    //  Do not display results if searchText was modified while searching.
                    if (trimmedSearchText === $.trim(self.contentHeaderView.getUserInput())) {

                        var videoSourceList = _.map(videoInformationList, function (videoInformation) {

                            //  I wanted the label to be duration | title to help delinate between typing suggestions and actual videos.
                            var videoDuration = parseInt(videoInformation.media$group.yt$duration.seconds, 10);
                            var videoTitle = videoInformation.title.$t;
                            var label = '<b>' + Utility.prettyPrintTime(videoDuration) + "</b>  " + videoTitle;

                            return {
                                label: label,
                                value: videoInformation
                            };
                        });

                        //  Show videos found instead of suggestions.
                        self.contentHeaderView.setAutocompleteSource(videoSourceList);
                        self.contentHeaderView.triggerAutocompleteSearch();
   
                    }
                });
            }
        },
        
        parseUrlInput: function () {
            var self = this;
            
            //  Wrapped in a timeout to support 'rightclick->paste' 
            setTimeout(function () {
                var url = self.contentHeaderView.getUserInput();
                var parsedVideoId = Utility.parseVideoIdFromUrl(url);

                //  If found a valid YouTube link then just add the video.
                if (parsedVideoId) {
                    self.handleValidInput(parsedVideoId);
                }
            });
            
        },
        
        searchIfNotEmpty: function () {
            
            var userInput = this.contentHeaderView.getUserInput();

            if (userInput.trim() != '') {
                this.contentHeaderView.triggerAutocompleteSearch();
            }
            
        },
        
        handleValidInput: function (videoId) {
            var self = this;
            this.contentHeaderView.clearUserInput();

            YouTubeDataAPI.getVideoInformation({
                videoId: videoId,
                success: function (videoInformation) {
                    self.model.addItemByInformation(videoInformation);
                },
                error: function () {

                    var bannedDialog = new Dialog({
                        text: 'Unable to use video because it was banned on copyright grounds.',
                        type: 'error'
                    });

                    var bannedDialogView = new DialogView({
                        model: bannedDialog
                    });

                    $('#contentWrapper').append(bannedDialogView.render().el);

                }
            });
        }
        
    });

    return PlaylistItemInputView;
});