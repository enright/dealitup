var express = require('express'),
	jade = require('jade'),
	app = express.createServer(),

// Configuration
app.configure(function () {
    // use jade
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    app.use(app.router);

    // serve up card images
    app.use(express.static(__dirname + '/public'));
});

app.get('/testHexMap', function (req, res) {
    res.render('hexMapTest', {
        layout: false,
		board: {
		    ranks: 12,
		    files: 4
		},
		tile: {
		    height: 72,
		    width: 72
		},
		// minified jade template for creating client-side maps is available as a local
		mapTemplate: hexMap.hexMapTemplate(),
		mapDivTemplate: hexMap.hexMapDivTemplate()
	});
});

app.get('/testSquareMap', function (req, res) {
    res.render('squareMapTest', {
        layout: false,
		board: {
		    ranks: 4,
		    files: 5
		},
		tile: {
		    height: 58,
		    width: 64
		},
		// minified jade template for creating client-side maps is available as a local
		mapTemplate: hexMap.squareMapTemplate(),
		mapDivTemplate: hexMap.squareMapDivTemplate()
	});
});

console.log("Express version %s\n", express.version);
app.listen(3001);
//console.log("Express server listening on port %d\n", app.address().port);

