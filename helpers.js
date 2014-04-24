Array.prototype.diff = function(a) {
	return this.filter(function(i) { return a.indexOf(i) < 0; });
};

Array.prototype.toUpper = function() {
	return this.map(function(x) { return x.toUpperCase(); });
}
