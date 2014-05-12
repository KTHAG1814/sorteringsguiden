var map;
var directions;
var directionsRenderer;
var position;
var markers = Array();
var lookup = {};
var positionMarker;

function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	markers = Array();
}

function zoomToFit() {
	if (markers.length == 0) return;

	var bounds = new google.maps.LatLngBounds();
	bounds.extend(position);

	for (var i = 0; i < markers.length; i++) {
		bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
	if (map.getZoom() > 15) {
		map.setZoom(15);
	}
}

function refresh() {
	clearMarkers();

	var items = $('#tags').tagsinput('items');
	var args = [];
	for (var i = 0; i < items.length; i++) {
		args.push(lookup[items[i]].type);
	}

	if (args.length == 0) {
		directionsRenderer.setMap(null);
		$('#map').slideUp(function() {
			$('.input-group-addon').removeClass('toggled');
			$('.bootstrap-tagsinput').removeClass('toggled');
		});
		return;
	}
	else {
		$('.input-group-addon').addClass('toggled');
		$('.bootstrap-tagsinput').addClass('toggled');
		$('#map').slideDown(function() {
			google.maps.event.trigger(map, 'resize');
			zoomToFit();
		});
	}

	var url = '/api/stations?args=' + args.join() + '&position=' + position.lat() + ',' + position.lng();
	$.get(url, function(data) {
		var waypoints = Array();
		var end = null;
		for (var i = 0; i < data.length; i++) {
			var station = data[i];
			var stationPos = new google.maps.LatLng(station.Lat, station.Lng);
			if (end == null) {
				end = station;
				end.Location = stationPos
			} else {
				if (end.Distance < station.Distance) {
					waypoints.push({
						location: end.Location,
						stopover: true
					});
					end = station;
					end.Location = stationPos;
				} else {
					waypoints.push({
						location: stationPos,
						stopover: true
					});
				}
			}
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(station.Lat, station.Lng),
				map: map,
			});
			markers.push(marker);

			var contentStr = '<b>' + station.Kind + '</b><br/>' + 
				station.Address + '<br />' + station.Types.join(', ');

			(function(marker, i, contentStr) {
				google.maps.event.addListener(marker, "click", function(e) { 
					var info = new google.maps.InfoWindow({
						content: contentStr
					});
					info.open(map,marker); 
				});
			})(marker, i, contentStr);
		}
		zoomToFit();

		if (end != null) {
			var request = {
				origin: position,
				destination: end.Location,
				travelMode: google.maps.TravelMode.WALKING,
				optimizeWaypoints: true
			};
			if (waypoints.length > 0) request.waypoints = waypoints;
			directions.route(request, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsRenderer.setMap(map);
					directionsRenderer.setDirections(response);
				}
			});
		}
	});
}

function init() {
	var mapOptions = {
		zoom: 13
	};

	map = new google.maps.Map(document.getElementById("map-canvas"),
		mapOptions);
	position = new google.maps.LatLng(59.347508, 18.073851);
	map.setCenter(position);
	positionMarker = new google.maps.Marker({
		position: position,
		map: map,
		icon: "http://i.stack.imgur.com/orZ4x.png"
	});


	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(pos) {
			position = new google.maps.LatLng(pos.coords.latitude,
				pos.coords.longitude);
			positionMarker.setPosition(position);
		});
	}

	directions = new google.maps.DirectionsService();
	directionsRenderer = new google.maps.DirectionsRenderer({
		suppressMarkers: true
	});

	var tags = $('#tags');
	tags.tagsinput();
	$.get('lookup.json', function(data) {
		var data_array = [];
		for (var i = 0; i < data.length; i++) {
			var obj = data[i];
			lookup[obj.name] = {
				'type': obj.type,
				'description': obj.description
			};
			data_array.push(data[i].name);
		}
		tags.tagsinput('input').typeahead({
			source: data_array,
			updater: function(item) {
				tags.tagsinput('add', item);
				refresh();
				return;
			},
			highlighter: function(item) {
				return item + ' <font color="#bbb"><small><i>' + lookup[item].description + '</i></small></font>';
			}
		});
	});
	tags.on('itemRemoved', function(event) {
		refresh();
	});

	var positionInfoText = $('#position-info').html();
	$('#position-info').click(function() {
		var elem = $('#map-canvas').find('.centerMarker');
		if (elem.length > 0) {
			$('#position-info').html(positionInfoText);
			elem.remove();
			position = map.getCenter();
			positionMarker.setPosition(position);
			positionMarker.setVisible(true);
			refresh();
		} else {
			$('<div/>').addClass('centerMarker').appendTo(map.getDiv());
			positionMarker.setVisible(false);
			$('#position-info').html('Flytta kartan så att den blåa punkter hamnar på din position, klicka sedan här igen.');
		}
	});

	// load background image
	$('body').css('background-image', 'url(field.jpg)');
}

google.maps.event.addDomListener(window, 'load', init);


