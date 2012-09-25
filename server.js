var express = require('express'),
	connect = require('connect'),
	sessionStore = new express.session.MemoryStore(),
	jade = require('jade'),
	deck = require('./deck'),
	app = express.createServer(),
	decks = {};
	
// Configuration
app.configure(function () {
    // use jade
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());

	// use cookies for sessions cookie must come before session
	app.use(express.cookieParser());
	//session cookies stored only in memory
	app.use(express.session({ store: sessionStore, secret: 'cool beans' }));
	
    app.use(app.router);

    // serve up card images
    app.use(express.static(__dirname + '/public'));
});

// create a deck
app.get('/new', function (req, res) {
	decks[req.session.id] = deck.createDeck();
    res.jsonp(201, { cardLeft: decks[req.session.id].cardsLeft() });
});

// create a deck
app.get('/neweuchre', function (req, res) {
	decks[req.session.id] = deck.createEuchreDeck();
    res.jsonp(201, { cardLeft: decks[req.session.id].cardsLeft() });
});

// shuffle a deck - error if no deck
app.get('/shuffle', function (req, res) {
	var aDeck = decks[req.session.id];
	if (aDeck !== undefined) {
		aDeck.shuffle();
		res.jsonp(200, { cardLeft: decks[req.session.id].cardsLeft() });
	} else {
		res.jsonp(500, { error: 'no deck' });
	}
});

// draw a card - error if no deck
app.get('/draw', function (req, res) {
	var aDeck = decks[req.session.id],
		drawnCard;
	if (aDeck !== undefined) {
		drawnCard = aDeck.draw();
		if (drawnCard !== undefined) {
			res.jsonp(200, { card: drawnCard });
		} else {
			res.jsonp(500, { error: 'no more cards' });
		}
	} else {
		res.jsonp(500, { error: 'no deck' });
	}
});

console.log("Express version %s\n", express.version);
app.listen(3001);
//console.log("Express server listening on port %d\n", app.address().port);

