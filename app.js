var express = require('express');
var mongo = require('mongodb');
var helpers = require('./helpers.js');

var Server = mongo.Server,
	Db = mongo.Db,
	BSON = mongo.BSONPure;
var server = new Server('localhost', 27017, { auto_reconnect: true });
var db = new Db('sorteringsguiden', server);

db.open(function(err, db) {
	if (!err) {
		console.log('Connected to MongoDB');
	}
});

var app = express();

app.use(express.static('client'));

var parse_stations = function(items, args, position) {
	for (var idx = 0; idx < items.length; idx++) {
		items[idx].Distance = helpers.distance(position[0], position[1], items[idx].Lat, items[idx].Lng);
	}

	var all_stations = [];
	for (var idx = 0; idx < items.length; idx++) {
		var n = 0;
		while (n < all_stations.length && items[idx].Distance > all_stations[n].Distance) {
			n++;
		}
		all_stations.splice(n, 0, items[idx]); 
	}

	// push all stations needed
	var stations = [];
	for (var n = 0; n < all_stations.length && args.length > 0; n++) {
		args = args.diff(all_stations[n].Types.toUpper());

		// cleanup
		//delete all_stations[n].Distance;
		delete all_stations[n].Types_Up;
		
		stations.push(all_stations[n]);
	}

	// if all types in station a exists in station b
	// remove station a
	for (var i = stations.length-1; i >= 0; i--) {
		for (var j = 0; j < stations.length; j++) {
			// don't check against same station
			if (j == i) { continue; }
			if (stations[i].Types.diff(stations[j].Types).length == 0) {
				stations.splice(i, 1);
				break;
			}
		}
	}

	return stations;
}

app.get('/api/stations', function(req, res) {
	// make sure the request is valid
	if (!req.query.args) res.send(400);
	if (!req.query.position) res.send(400);

	var args = req.query.args.split(',').toUpper();
	if (args.length < 1) res.send(400);

	var position = req.query.position.split(',');
	if (position.length != 2) res.send(400);

	db.collection('stations', function(err, collection) {
		collection.find({
			Types_Up: { $in: args }
		}).toArray(function(err, items) {
			res.send(parse_stations(items, args, position));
		});
	});
});

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});
