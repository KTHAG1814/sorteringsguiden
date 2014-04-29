var fti = require('./../data/fti.json')

for (var i = 0; i < fti.length; i++) {
	var obj = fti[i];
	delete obj.Id;
	delete obj.MunicipalityId;
	delete obj.Xposition;
	delete obj.Yposition;
	obj.Kind = "Återvinningsstation";
	obj.Types_Up = obj.Types.map(function(x) { return x.toUpperCase(); });
}

console.log(fti);

