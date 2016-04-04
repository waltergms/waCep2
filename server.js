var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var jsdom = require("jsdom");
var strUrl = 'http://m.correios.com.br/movel/buscaCepConfirma.do';
var iconv = require('iconv-lite');
var port = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('port', port);

var server = app.listen(app.get('port'), function () {
	console.log('Express server listening on port ' + server.address().port);
});

app.get('/', function (req, res) {
	try {
		res.type('json');               // => 'application/json'
		res.set('Content-Type', 'application/json');
		var strCep = req.query.cep;
		strCep = strCep.replace(/[^0-9.]/g, '').replace(/\./g, '');
		if(strCep.length==8){
			GetCepCorreios(strCep, function (result) {
				res.send(result);
			});
		} else {
			res.send({ "Error" : "CEP invalido!" });
		}
	} catch (e) {
		res.send({ "Error" : "CEP invalido!" });
	}
});


function GetCepCorreios(strCep, callback) {
	try {
		request.post({
			encoding: null,
			url: strUrl, form: {
				'cepEntrada' : strCep,
				'tipoCep' : '',
				'cepTemp' : '',
				'metodo' : 'buscarCep'
			}
		}, function (err, httpResponse, body) {
			if(err!= null){
				callback(new Error(err));
			}else{
				var bodyWithCorrectEncoding = iconv.decode(body, 'iso-8859-1');
				GetJsonCep(bodyWithCorrectEncoding, function (result) {
					callback(result);
				});
			}
		});
	} catch (e) {
		callback(new Error(e));
	}
}

function GetJsonCep(body, callback) {
	try {
		jsdom.env(body, function (err, window) {
			var address = [];
			var jsonAddress = { Logradouro : "", Endereco : "", Numero : "", Bairro : "", UF : "", Cidade  : "" };
			var $ = require("jquery")(window);
			$('.respostadestaque').each(function () {
				console.log(" -", $.trim($(this).text()));
				address.push($.trim($(this).text()));
			});
			if(address.length > 0){
				jsonAddress.Logradouro = $.trim(address[0].split('-')[0].split(' ')[0]);
				jsonAddress.Endereco = $.trim(address[0].split('-')[0].substr(jsonAddress.Logradouro.length));
				jsonAddress.Numero = $.trim(address[0].split('de ')[1]);
				jsonAddress.Bairro = $.trim(address[1]);
				jsonAddress.Cidade = $.trim(address[2].split('/')[0]);
				jsonAddress.UF = $.trim(address[2].split('/')[1]);
			}
			callback(jsonAddress);
		});
	} catch (e) {
		callback(new Error(e));
	}
}
