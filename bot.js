/* Node.js */
var needle = require('needle');
var fs = require('fs');

var BASE_URL = "https://api.telegram.org/botTUOIDTUTTO"; // ID del BOT da sostituire
var POLLING_URL = BASE_URL + "getUpdates?offset=:offset:&timeout=60";
var SEND_MESSAGE_URL = BASE_URL + "sendMessage";
var SEND_PHOTO_URL = BASE_URL + "sendPhoto";
var CREATOR_ID = ; // ID del creatore

/*
	start - Da' il benvenuto
	help - Visualizza l'elenco dei comandi con relativi aiuti
	esami - Visualizza la lista dei prossimi esami
	citazioni - Visualizza una citazione a caso
	foto - Invia una foto a caso
	yesno - PROVA
	dosth - PROVA
	esercizi - Invia un esercizio (ancora da implementare)
*/

function sendErrorMessage (text) {
	sendSimpleTextMessage(CREATOR_ID, text);
}

function sendMessage (msg) {
	needle.post(SEND_MESSAGE_URL, msg, function(err, response) {
			if (err) { console.log("Errore nella spedizione del messaggio\n"); console.log(response); return false; }
			if (response.status == 200) console.log("Messaggio spedito con successo a " + msg.chat_id);
	});
}

function sendSimpleTextMessage (chat_id, text) {
	var answer = {
		chat_id: chat_id,
		text: text
	};
	
	sendMessage(answer);
}

var dosth = function (message) {
	var caps = message.text.toUpperCase();
	sendSimpleTextMessage(message.chat.id,
			"You told me to do something, so I took your input and made it all caps. Look: " + caps);
}

var start = function (message) {
	sendSimpleTextMessage(message.chat.id,
		"Benvenuto su SNS Mate 2014");
}

var help = function (message) {
	sendSimpleTextMessage(message.chat.id,
		"Elenco di comandi che puoi utilizzare:\n"+
		"/help\t  Visualizza questa scritta\n"+
		"/dosth msg\t  Converte il messaggio in lettere maiuscole\n");
}

var yesno = function (message) {

	var keyboard = {
		keyboard: [ ["Yes", "No"] ],
		one_time_keyboard: true,
		resize_keyboard: true
	};
	
	var answer = {
		chat_id: message.chat.id,
		text: 'Yes or No?',
		reply_markup: JSON.stringify(keyboard)
	};
	
	sendMessage(answer);
}

var admin = function (message) {
	if (message.chat.id == CREATOR_ID) {
		sendSimpleTextMessage(message.chat.id, "Si, sei negli Admin");
	} else {
		sendSimpleTextMessage(message.chat.id, "WTF?");
	}
}

//Mostra gli esami contenuti nel file esami.txt
var esami = function (message) {
	fs.readFile("esami.txt", function (err, logData) {
		if (err) {
			sendErrorMessage("esami.txt errore");
			return false;
		}
		var text = logData.toString();
		var lines = text.split("\n");

		var totale = 0;
		var messaggio = "Lista dei prossimi esami:\n";
		lines.forEach(function (line) {
			if (line != "") {
				var parts = line.split("\t");
				totale++;
				messaggio += parts[0] + ", il " + parts[1] + " ore " + parts[2] + " in aula " + parts[3] + "\n";
			}
		});
		messaggio += "\nTotale esami: " + totale + "";

		sendSimpleTextMessage(message.chat.id, messaggio);
	});
}

function randomInBetween (minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function sendRandomLine (chat_id, filename) {
	fs.readFile(filename, function (err, logData) {
		if (err) {
			sendErrorMessage(filename + " errore");
			return false;
		}
		var text = logData.toString();
		var lines = text.split("\n");
		sendSimpleTextMessage(chat_id, lines[randomInBetween(0, lines.length-1)]);
	});
}

var citazioni = function (message) {
	sendRandomLine(message.chat.id, "citazioni.txt");
}

//Toglie gli esami la cui data è anteriore a quella attuale
function aggiornaEsami () {
	
}

var esercizi = function (message) {
	sendSimpleTextMessage(message.chat.id, "Funzione ancora da implementare");
}

var scusu = function (message) {
	sendSimpleTextMessage(message.chat.id, "Scusu Cusu");
}

var foto = function (message) {

	fs.readdir('images/', function (err, files){
		if (err) {console.log("Error in reading images/ directory"); return false;}
		
		var answer = {
			chat_id: message.chat.id,
			photo: { file: 'images/'+files[randomInBetween(0, files.length-1)], content_type: 'multipart/form-data'}
		};
	
		needle.post(SEND_PHOTO_URL, answer, {multipart: true}, function (err, resp, body) {
					if (err) {console.log("Errore"); return false; }
		});
	});
}

var COMMANDS = {
	"start" : start,
	"help" : help,
	"dosth" : dosth,
	"yesno" : yesno,
	"admin" : admin,
	"esami" : esami,
	"citazioni" : citazioni,
	"esercizi" : esercizi,
	"scusu" : scusu,
	"foto" : foto
};

function poll(offset) {
	var url = POLLING_URL.replace(":offset:", offset);
	console.log("Polling for new messages...");
	needle.get(url, function(err, response, body) {
			if (!err && response) {
				if (response.statusCode == 200) {
					var result = body.result;
					console.log("Got "+ result.length +" messages");
					if (result.length > 0) {
						for (i in result) {
							if (runCommand(result[i].message)) continue;
						}
						
						max_offset = parseInt(result[result.length - 1].update_id) + 1; //update max offset
					}
				} else {
					console.log("Bad response, status = " + response.statusCode);
				}
			} else {
				console.log("Timed out");
			}
			poll(typeof max_offset === 'undefined' ? 0 : max_offset);
		});
}

function runCommand(message) {
	var msgtext = message.text;
	
	if (msgtext.indexOf("/") != 0) return false; //no slash at beginning
	var command = msgtext.substring(1, msgtext.indexOf(" ") == -1 ? msgtext.length : msgtext.indexOf(" "));
	if (COMMANDS[command] == null) { // not a valid command
		sendSimpleTextMessage(message.chat.id, "Comando non valido\nPer una lista dei comandi digita /help");
		return false;
	}
	COMMANDS[command](message);
	return true;
}

console.log("Bot started...");

needle.defaults({
  open_timeout: 60000,
  user_agent: 'MyBot/1.0'});

poll(0);
