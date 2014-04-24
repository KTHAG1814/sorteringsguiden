var express = require('express');
var sqlite3 = require('sqlite3');
var helpers = require('./helpers.js');

var app = express();
var db = new sqlite3.Database('test.db');

// query to fetch stations from database
// TODO: 	currently it fetches all stations that match all types, limit
// 			result to contain only enough stations to suffice all provided types
// 			and order by distance (spatialite).
var QUERY_STATIONS = "SELECT s.id,s.name,t.name as type FROM typemap tm, stations s, types t" +
	" WHERE tm.type_id = t.id AND (upper(t.name) IN (%TYPES%)) AND s.id = tm.station_id ORDER BY t.name";

app.get('/stations', function(req, res) {
	// make sure the request is valid
	if (!req.query.args) res.send(400);
	if (!req.query.position) res.send(400);

	var args = req.query.args.split(',').toUpper();
	if (args.length < 1) res.send(400);

	var position = req.query.position.split(',');
	if (position.length != 2) res.send(400);

	// prepare array
	var qm = Array.apply(null, new Array(args.length)).map(String.prototype.valueOf, '?').join();
	var query = db.prepare(QUERY_STATIONS.replace('%TYPES%', qm));

	var s = {};
	query.each(args, function(err, row) {
		// make sure only one object is created for each station
		// and concatenate types into an array
		if (!s[row.id]) {
			s[row.id] = {
				'types': []
			};
		}
		s[row.id].station_id = row.id;
		s[row.id].name = row.name;
		s[row.id].types.push(row.type);
		s[row.id].distance = Math.random();
	}, function() {
		// create array of station, sort by distance
		var all_stations = [];
		for (var idx in s) {
			var n = 0;
			while (n < all_stations.length && s[idx].distance > all_stations[n].distance) {
				n++;
			}
			all_stations.splice(n, 0, s[idx]); 
		}

		// push all stations needed
		var stations = [];
		for (var n = 0; n < all_stations.length && args.length > 0; n++) {
			args = args.diff(all_stations[n].types.toUpper());
			stations.push(all_stations[n]);
		}

		// if all types in station a exists in station b
		// remove station a
		for (var i = stations.length-1; i >= 0; i--) {
			for (var j = 0; j < stations.length; j++) {
				// don't check against same station
				if (j == i) { continue; }
				if (stations[i].types.diff(stations[j].types).length == 0) {
					stations.splice(i, 1);
					break;
				}
			}
		}

		// done
		res.send({'stations': stations});
	});
});

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});
