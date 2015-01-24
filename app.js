var request = require('request');
var baseUrl = 'http://charts.spotify.com/api/tracks/most_streamed';

var trackMap = {}
var regions = ["ar","at","au","be","bg","ch","cl","co","cr","cz","de","dk","ec","ee","es","fi","fr","gb","gr","gt","hk","hu","ie","is","it","li","lt","lu","lv","mx","my","nl","no","nz","pe","pl","pt","se","sg","sk","sv","tr","tw","us","uy"];
var regionIdx = 0;

var nextRegion = function() {
	var region = regions[regionIdx];
	console.log("Retrieving stats for '"+region+"'");
	request(baseUrl + '/' + region + '/weekly/latest', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	var i = 1;
	    JSON.parse(body).tracks.forEach(function(track) {
	    	var key = track.track_name + '_' + track.artist_name;
	    	if (typeof trackMap[key] == 'undefined') {
	    		trackMap[key] = {
	    			track: 		track,
	    			regions: 	[],
	    			positions: 	[],
	    			streams: 	0
	    		};
	    	} 

    		trackMap[key].regions.push(region);
    		trackMap[key].positions.push(i);
    		trackMap[key].streams += track.num_streams;
	    	i++;
	    });

	    regionIdx++;
	    if (regionIdx >= regions.length) {
	    	done();
	    } else {
	    	nextRegion();
	    }
	  }
	});
};

var done = function() {
	console.log('-------------------------------------');
	
	/* This is how far up the top list a track should be to be considered interesting */
	var top = 20;

	var stats = {
		nrTopTracks: 				0,
		nrSingleRegionTracks: 		0,
		nrSingleRegionTopTracks: 	0,
	} 
	
	for (key in trackMap) {
		var obj = trackMap[key];
		stats.nrTopTracks++;
		if (obj.regions.length === 1) {
			stats.nrSingleRegionTracks++;
			stats.nrSingleRegionTopTracks + (obj.positions[0] <= top? 1: 0);
		}
	}

	console.log('Total number of unique top tracks: ' + stats.nrTopTracks);
	console.log('Number top tracks appearing in only one region: ' + stats.nrSingleRegionTracks);
	console.log('Number top tracks appearing in only one region and in top ' + top + ': ' + stats.nrSingleRegionTopTracks);

	//Create indexed array
	var orderedTracks = [];
	for (key in trackMap) {
		orderedTracks.push(trackMap[key]);
	}
	orderedTracks.sort(function(a, b){
		var calcMean = function(arr) {
			var sum = 0;
			arr.forEach(function(v) {
				sum += v;
			});		
			return sum/arr.length;	
		}
		return calcMean(a.positions)-calcMean(b.positions);
	});

	console.log('Sorted by best chart position, you should listen to the following local hits appearing in top '+top+':');
	orderedTracks.forEach(function(obj) {
		if (obj.regions.length === 1) {
			if (obj.positions[0] <= top) { //Only include songs in top
				console.log('Chart position ' + obj.positions[0] + ' in ' + obj.regions[0] + ': "' + obj.track.track_name + '" by ' + obj.track.artist_name + ' (' + obj.track.track_url + ')');
			}
		}
	});

}

nextRegion();