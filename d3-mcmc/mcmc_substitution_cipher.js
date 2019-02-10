// MCMC algorithm to decode substitution ciphers.
// For details see Diaconis, P. The Markov Chain Monte Carlo Revolution.
// http://www.ams.org/journals/bull/2009-46-02/S0273-0979-08-01238-X/S0273-0979-08-01238-X.pdf

// Build a table of transition counts between individual letters.
// Note that we count transitions regardless of whether the characters can be substituted.
function build_transition_table(strings, alphabet) {
    
    // Initialize the table with an initial count of some small number for each transition.
    var transitions = new Map();
    for (var i = 0; i < alphabet.length; i++)
	for (var j = 0; j < alphabet.length; j++)
	    transitions.set(alphabet[i] + alphabet[j], 0.05);

    for (var i = 0; i < strings.length; i++) {
	var s = strings[i].toLowerCase();
	for (var j = 0; j < s.length - 1; j++)
	    transitions.set(
		s[j] + s[j + 1],
		transitions.get(s[j] + s[j + 1]) + 1);
    }

    var totals = new Map();
    for (var i = 0; i < alphabet.length; i++)
	totals.set(alphabet[i], 0);
    transitions.forEach(function(count, chars) {
	totals.set(chars[0], totals.get(chars[0]) + count);
    });

    var probabilities = new Map();
    transitions.forEach(function(count, chars) {
	probabilities.set(chars, count / totals.get(chars[0]));
    });

    return probabilities;
}

// Return a random key based on the given alphabet.
function random_key(alphabet) {
    // Convert alphabet to an array and shuffle it.
    var a = alphabet.split('');
    for (var i = 0; i < a.length; i++) {
        var j = Math.floor(Math.random() * (a.length - i)) + i;
        var t = a[i];
        a[i] = a[j];
        a[j] = t;
    }

    // Map the alphabet to the shuffled array.
    var key = new Map();
    for (var i = 0; i < a.length; i++)
	key.set(alphabet[i], a[i]);
    return key;
}

// Encode some text using the given key.
function translate(text, key) {
    var result = '';
    for (var i = 0; i < text.length; i++) {
	// Preserve case.
	var isUpper = text[i].toLowerCase() != text[i];
	var original = text[i].toLowerCase();

	var replacement;
	if (key.has(original)) {
	    replacement = key.get(original);
	} else {
	    replacement = original;
	}
	
	if (isUpper) {
	    result += replacement.toUpperCase();
	}
	else {
	    result += replacement;
	}
    }
    return result;
}

// Compute the log-likelihood of the decoded text according to the transition table.
function loglikelihood(key, encoded, T) {
    var result = 0;
    for (var i = 0; i < encoded.length; i++) {
	var decoded = translate(encoded[i], key).toLowerCase();
	for (var j = 0; j < decoded.length - 1; j++) {
	    var c1 = decoded[j];
	    var c2 = decoded[j + 1];
	    result += Math.log(T.get(c1 + c2));
	}
    }
    // Multiply the log-likelihood by a constant.
    // Higher constants will mean that 
    return result;
}

var doc_elements = [
    document.getElementById('info').innerHTML
];

// Define the plaintexts.
var pts = [
    'Hamiltonian Monte Carlo sampler'
    //'the quick red fox jumped over the lazy brown dog'
];

// alphabet contains those letters which can be substituted for others.
var alphabet = 'abcdefghijklmnopqrstuvwxyz';

// Construct the transition table.
var T = build_transition_table(pts, alphabet + '. 2017');

// Encode plaintexts.
var real_key = random_key(alphabet);
var encoded = new Array();
for (var i = 0; i < pts.length; i++)
    encoded[i] = translate(pts[i], real_key);

// key will be our sampled state. Start from a random key.
var key = random_key(alphabet);
var ll = loglikelihood(key, encoded, T);

function step() {
    // Construct a proposal key by copying the current state but swapping mappings at random indices a and b.
    var proposal_key = new Map();
    var a = Math.floor(Math.random() * alphabet.length);
    var b = Math.floor(Math.random() * alphabet.length);
    for (var i = 0; i < alphabet.length; i++) {
	var ind;
	if (i == a) {
	    ind = b;
	} else if (i == b) {
	    ind = a;
	} else {
	    ind = i;
	}
	proposal_key.set(alphabet[i],
			 key.get(alphabet[ind]));
    }

    // Compute the log-likelihood of the proposal.
    var proposal_ll = loglikelihood(proposal_key, encoded, T);

    // Metropolis-Hastings acceptance step.
    if (Math.random() < Math.exp(proposal_ll - ll)) {
	// If accepted, store the proposed key.
	key = proposal_key;
	// Store the likelihood so we don't have to compute it each iteration.
	ll = proposal_ll;
	// Update the displayed text.
	for (var i = 0; i < doc_elements.length; i++){
	  doc_elements[i] = translate(encoded[i], key, T);
	  document.getElementById('info').innerHTML = doc_elements[i];
	}
  }
}

setInterval(step, 10);
