var map;
var position;
var markers = [];
var lookup = {};

function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	markers = [];
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
		$('#map-canvas').slideUp(function() {
			$('.input-group-addon').removeClass('toggled');
			$('.bootstrap-tagsinput').removeClass('toggled');
		});
		return;
	}
	else {
		$('.input-group-addon').addClass('toggled');
		$('.bootstrap-tagsinput').addClass('toggled');
		$('#map-canvas').slideDown(function() {
			google.maps.event.trigger(map, 'resize');
			zoomToFit();
		});
	}

	var url = '/api/stations?args=' + args.join() + '&position=' + position.lat() + ',' + position.lng();
	$.get(url, function(data) {
		for (var i = 0; i < data.length; i++) {
			var station = data[i];

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
	});
}

function init() {
	var mapOptions = {
		zoom: 13
	};

	map = new google.maps.Map(document.getElementById("map-canvas"),
		mapOptions);

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(pos) {
			position = new google.maps.LatLng(pos.coords.latitude,
				pos.coords.longitude);
			map.setCenter(position);
		});
	} else {
		alert('Update browser to support HTML5 geolocation');
	}

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
}

google.maps.event.addDomListener(window, 'load', init);


