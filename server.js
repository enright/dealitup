var express = require('express'),
	deck = require('./deck'),
	uuid = require('uuid'),
	aws = require('aws-sdk'),
	dynamo,
	app = express(),
	decks = {};
	
// Configuration
app.configure(function () {
	// some restful service calls (POST, PUT)
	// send data in the 'body' of the request
	// so we need to let express parse the body to get the parameters out
    app.use(express.bodyParser());

	// this enables the code below that specifies the functions
	// executed for specific URL requests
    app.use(app.router);
    
    // load the amazon credentials
    // note this 'clobbers' any previous configuration
    aws.config.loadFromPath('./amazonCred.json');
    
	dynamo = new aws.DynamoDB();
});

// at the root of our server, a get request will simply return the 
// drag and drop card page, which is an html page, not a service
app.get('/', function (req, res) {
	res.sendfile('deck.html');
});

app.get('/listTables', function (req, res) {
	dynamo.listTables(function(err, data) {
	  if (err) {
	  	res.json(err);
	  } else {
	  	res.json(data.TableNames);
	  }
	});
});

app.get('/createTable', function (req, res) {
	var tableDef = {
		TableName: 'dealItUp',
		AttributeDefinitions: [
			{ AttributeName: 'id', AttributeType: 'S' }
		],
		KeySchema:[
			{ AttributeName: 'id', KeyType: 'HASH' }
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 12,
			WriteCapacityUnits: 6,
		}
	};
	dynamo.createTable(tableDef, function(err, data) {
	  if (err) {
	  	res.json(err);
	  } else {
	  	res.json(data.TableDescription);
	  }
	});
});

// WEB SERVICE CALLS

// get a deck
app.get('/deck/:id', function (req, res) {
	var id = req.params.id;
	if (decks.hasOwnProperty(id)) {
    	res.jsonp(201, { deck: id, cardsLeft: decks[id].cardsLeft() });
    } else {
    	res.jsonp(404, { error: 'deck id not found' });
    }
});

// create a deck
app.post('/deck', function (req, res) {
	var aDeck = deck.createDeck(), // create a deck
		aUuid = uuid.v4(); // pair it with this unique identifier
		
	// store the deck
	decks[aUuid] = aDeck;
	
	// give the client the deck id 201 === created
    res.jsonp(201, { deck: aUuid, cardsLeft: aDeck.cardsLeft() });
});

// delete a deck
app.delete('/deck/:id', function (req, res) {
	var id = req.params.id;
	console.log('deck id ', id, '\n decks \n', decks);
	if (decks.hasOwnProperty(id)) {
		delete decks[id];
    	res.jsonp(200, { deck: id }); // 200 === succeeded
    } else {
    	res.jsonp(404, { error: 'deck id not found' });
    }
});

// modify a deck - error if no deck
// body contains parameters (so no id in the url)
app.put('/deck', function (req, res) {
	var id = req.body.id,
		update = req.body.update;
	if (decks.hasOwnProperty(id)) {
		if (update === 'shuffle') {
			decks[id].shuffle();
			res.jsonp(200, { cardsLeft: decks[id].cardsLeft() });
		} else if (update === 'draw') {
			res.jsonp(200, { card: decks[id].draw() });
		} else {
    		res.jsonp(400, { error: 'unknown update' }); // 400 === bad request
		}
	} else {
    	res.jsonp(404, { error: 'deck id not found' });
	}
});



console.log("restfulDeckServer running localhost:3001");
app.listen(3001);

