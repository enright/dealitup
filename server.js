var express = require('express'),
	deck = require('./deck'),
	request = require('superagent'),
	app = express();
	
// Configuration
app.configure(function () {
	// some restful service calls (POST, PUT)
	// send data in the 'body' of the request
	// so we need to let express parse the body to get the parameters out
    app.use(express.json());

	// this enables the code below that specifies the functions
	// executed for specific URL requests
    app.use(app.router);
});

// at the root of our server, a get request will simply return the 
// drag and drop card page, which is an html page, not a service
app.get('/', function (req, res) {
	res.sendfile('deck.html');
});

// WEB SERVICE CALLS

// a function takes the input, the functions to exec, and a callback
// funcsInOrder = [fn1, fn2...]
// callback = function (err, result) {...
function chainFunctions(input, funcsInOrder, completed) {
	var i = -1, numFuncs = funcsInOrder.length; 
	function passItOn(err, result) {
		if (err) {
			// failed
			completed(err, result);
		} else {
			i += 1;
			if (i < numFuncs && funcsInOrder[i]) {
				funcsInOrder[i](result, passItOn);
			} else {
				// done (success)
				completed(err, result);
			}
		}		
	}
	return function () {
		passItOn(null, input);
	};
}

// create a function from a function
// treat the last parameter of a call to the returned function as a callback
// call the original function without the callback prameter
// then call the callback with null error and the result of the original function
function fakeback(functionToFake) {
	// return a function that expects the last argument, when called, to be a callback
	return function () {
		// make a real array from the arguments
		var args = Array.prototype.slice.apply(arguments),
			// pop the callback off the args array
			callback = args.pop(),
			// call the original function will all arguments except the callback
			result = functionToFake.apply(null, args);
		// call the callback with the successful result
		callback(null, result);
	}
}

function getDeck(data, callback) {
	request
		.get('http://localhost:3002/deck/' + data.id)
		.set('Accept', 'application/json')
		.end(function (err, res) {
			var drawPile,
				drawn,
				discarded,
				aDeck;
			if (err) {
				callback(err, data);
			} else if (res.error) {
				data.error = res.status;
				data.response = res.body;
				callback(res.status, data);
			} else {
				drawPile = JSON.parse(res.body.deck);
				drawn = JSON.parse(res.body.drawn);
				discarded = JSON.parse(res.body.discarded);
				// once we have the deck data, instantiate deck and give it to callback
				aDeck = deck.createDeck(drawPile, drawn, discarded);
				data.deck = aDeck;
				callback(null, data);
			}
		});
}

function putDeck(data, callback) {
	request
		.put('http://localhost:3002/deck')
		.send({ id: data.id, deck: JSON.stringify(data.deck.getCards()),
			drawn: JSON.stringify(data.deck.getDrawn()),
			discarded: JSON.stringify(data.deck.getDiscard()),
			removed: JSON.stringify([]) })
		.set('Content-type', 'application/json')
		.set('Accept', 'application/json')
		.end(function (err, res) {
			if (err) {
				callback(err, data);
			} else if (res.error) {
				data.error = res.status;
				data.response = res.body;
				callback(res.status, data);
			} else {
				callback(null, data);
			}
		});
}

// get a deck
app.get('/deck/:id', function (req, res) {
	var id = req.params.id;
	request
		.get('http://localhost:3002/deck/' + id)
		.set('Accept', 'application/json')
		.end(function (err, response) {
			var drawPile,
				drawn,
				discarded,
				aDeck;
			if (err) {
				res.json(500, err);
			} else if (response.error) {
				res.json(response.status, response.body);
			} else {
				drawPile = JSON.parse(response.body.deck);
				drawn = JSON.parse(response.body.drawn);
				discarded = JSON.parse(response.body.discarded);
				// we don't used 'removed' cards in this game, so we ignore response.body.removed
				
				// once we have the deck data, instantiate deck
				aDeck = deck.createDeck(drawPile, drawn, discarded);
				res.json(200, { id: id, cardsLeft: aDeck.cardsLeft() });
			}
		});
});

// create a deck
app.post('/deck', function (req, res) {
	var aDeck,
		body = req.body,
		type = body && body.type;

	console.log(req.body);
	console.log('create deck type ', type);
	if (type === 'standard') {
		aDeck = deck.createDeck();
	} else if (type === 'euchre') {
		aDeck = deck.createEuchreDeck();
	} else if (type === 'custom') {
		aDeck = deck.createDeck(body.cards, body.drawn, body.discard);
	} else {
		res.json(200, { error: 'unknown deck type' });
		return;
	}
		
	request
		.post('http://localhost:3002/deck')
		.send({ deck: JSON.stringify(aDeck.getCards()),
			drawn: JSON.stringify(aDeck.getDrawn()),
			discarded: JSON.stringify(aDeck.getDiscard()),
			removed: JSON.stringify([]) })
		.set('Content-type', 'application/json')
		.set('Accept', 'application/json')
		.end(function (err, response) {
			if (err) {
				res.json(500, err);
			} else if (response.error) {
				res.json(response.status, response.error);
			} else {
				if (response.body && response.body.id) {
					res.json(201, { id: response.body.id, cardsLeft: aDeck.cardsLeft() });
				} else {
					res.json(400, { error: 'no id returned from storage' });
				}
			}
		});

});

// delete a deck
app.delete('/deck/:id', function (req, res) {
	var id = req.params.id;
	
	if (!id) {
		res.json(400, { error: 'no id provided' });
	} else {
		request
			.del('http://localhost:3002/deck/' + id)
			.set('Accept', 'application/json')
			.end(function (err, response) {
				if (err) {
					res.json(500, err);
				} else if (response.error) {
					res.json(response.status, response.error);
				} else {
					res.json(200, { id: id });
				}
			});
	}
});

// modify a deck - error if no deck
// body contains parameters (so no id in the url)
app.put('/deck', function (req, res) {
	var body = req.body,
		id = body && body.id,
		update = body && body.update,
		card = body && body.card;
		
	// update the deck and return it
	function shuffleOrDrawOrDiscard(data) {
		if (data.update === 'shuffle') {
			data.deck.shuffle();
			data.result = { cardsLeft: data.deck.cardsLeft() };
		} else if (data.update === 'draw') {
			data.result = { card: data.deck.draw() };
		} else if (data.update === 'discard') {
			data.deck.discard(data.card);
			data.result = { cardsLeft: data.deck.cardsLeft() };
		}
		return data;
	}
	
	if (update !== 'shuffle' && update !== 'draw' && update !== 'discard') {
		res.jsonp(405, 'bad request ' + udpate);
	} else if (update === 'discard' && !card) {
		res.json(405, 'must provide card for discard');
	} else {
		chainFunctions({ id: id, update: update, card: card },
			[getDeck, fakeback(shuffleOrDrawOrDiscard), putDeck],
			function (err, data) {
				if (err) {
					res.jsonp(400, err);
				} else {
					res.jsonp(200, data.result);
				}
			})();
	}
		
});


console.log("restfulDeckServer running localhost:3001");
app.listen(3001);

