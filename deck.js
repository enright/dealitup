// create a deck with supplied cards
// standard deck is supplied if cards are not
function createDeck(cards) {
	var deck = {},
		drawn = [],
		discard = [],
		top;
	
	function standardDeck() {
		// fill in a standard deck
		var suits = [ 'c', 'd', 'h', 's' ],
			pips = 13, // 1 = ace, 13 = king
			i, 
			length,
			cards = [];
			
		// create a string for the pip ('0' prepended to numbers < 10)
		function pipStr(pip) {
			if (pip < 10) {
				return '0' + pip;
			} else {
				return pip;
			}
		}
		
		for (i = 0, length = suits.length * pips; i < length; i += 1) {
			cards[i] = pipStr(Math.floor(i%pips) + 1) + suits[Math.floor(i/pips)];
		}
		return cards;
	}
	
	if (cards === undefined) {
		cards = standardDeck();
	}
	
	top = cards.length - 1;
	
	// To shuffle an array a of n elements (indices 0..n-1):
	// for i from n - 1 downto 1 do
    //		j = random integer with 0 <= j <= i
    //		exchange a[j] and a[i]
	function shuffle() {
		var i, 
			j, 
			temp;
		for (i = cards.length - 1; i > 0; i -= 1) {
			j = Math.floor(Math.random() * (i + 1));
			temp = cards[j];
			cards[j] = cards[i];
			cards[i] = temp;
		}
	}
	
	deck.shuffle = shuffle;
	
	// draw a card from the top of the deck
	// returns undefined if deck is depleted
	function draw() {
		var drawCard;
		if (top > -1) {
			drawCard = cards[top];
			drawn[drawn.length] = drawCard;
			top -= 1;
		}
		return drawCard;
	}
	
	deck.draw = draw;
	
	// return how many cards are left to draw
	function cardsLeft() {
		return top + 1;
	}
	
	deck.cardsLeft = cardsLeft;
	
	// add a card to the discard list
	function discard(card) {
		discard[discard.length] = card;
	}
	
	deck.discard = discard;
	
	// shuffle and reset draw, discard and top
	function resetShuffle() {
		top = cards.length - 1;
		draw = [];
		discard = [];
		shuffle();
	}
	
	deck.resetShuffle = resetShuffle;
	
	return deck;
}

exports.createDeck = createDeck;

function createEuchreDeck () {
	// create a deck from 9-A for playing Euchre  
	return createDeck(['01c', '01d', '01h', '01s',
		'09c', '09d', '09h', '09s',
		'10c', '10d', '10h', '10s',
		'11c', '11d', '11h', '11s',
		'12c', '12d', '12h', '12s',
		'13c', '13d', '13h', '13s']);
}

exports.createEuchreDeck = createEuchreDeck;