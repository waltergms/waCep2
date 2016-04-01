var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var jsdom = require("jsdom");
var strUrl = 'http://m.correios.com.br/movel/buscaCepConfirma.do';
var iconv = require('iconv-lite');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

app.set('port', server_port);

var server = app.listen(app.get('port'), server_ip_address, function () {
	console.log('Express server listening on port ' + server.address().port);
});

app.get('/', function (req, res) {
	res.type('json');               // => 'application/json'
	res.set('Content-Type', 'application/json');
	var strCep = req.query.cep;
	GetCepCorreios(strCep, function (result) {
		res.send(result);
	});
});

function GetCepCorreios(strCep, callback) {
	request.post({
		encoding: null,
		url: strUrl, form: {
			'cepEntrada' : strCep,
			'tipoCep' : '',
			'cepTemp' : '',
			'metodo' : 'buscarCep'
		}
	}, function (err, httpResponse, body) {
		var bodyWithCorrectEncoding = iconv.decode(body, 'iso-8859-1');
		GetJsonCep(bodyWithCorrectEncoding, function (result) { 
			callback(result);
		});
	});
}

function GetJsonCep(body, callback) {
	jsdom.env(body, function (err, window) {
		var address = [];
		var jsonAddress = { Logradouro : "", Endereco : "", Numero : "", Bairro : "", UF : "", Cidade  : "" };
		var $ = require("jquery")(window);
		$('.respostadestaque').each(function () {
			console.log(" -", $.trim($(this).text()));
			address.push($.trim($(this).text()));
		});
		jsonAddress.Logradouro = $.trim(address[0].split('-')[0].split(' ')[0]);
		jsonAddress.Endereco = $.trim(address[0].split('-')[0].substr(jsonAddress.Logradouro.length));
		jsonAddress.Numero = $.trim(address[0].split('de ')[1]);
		jsonAddress.Bairro = $.trim(address[1]);
		jsonAddress.Cidade = $.trim(address[2].split('/')[0]);
		jsonAddress.UF = $.trim(address[2].split('/')[1]);
		callback(jsonAddress);
	});
}
