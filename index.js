const express = require('express');
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var http = require('http');
var fs = require('fs');
var path = require('path');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var mongooseDynamic = require ('mongoose-dynamic-schemas');
var Schema = mongoose.Schema;
var jsdom = require("jsdom");
const { JSDOM } = jsdom;
var MongoClient = require('mongodb').MongoClient;
var mongoDBurl = "mongodb://itamard:Google100!@ds229312.mlab.com:29312/forms";
mongoose.connect(mongoDBurl);

var formSchema = new mongoose.Schema({
	form_id: Number,
	form_name: String,
	num_submissions: Number,
	fields: mongoose.Schema.Types.Mixed,
	submissions: { 	}
});
var Submit = mongoose.model('forms', formSchema);


app.use(express.static('public'))
app.use(express.static('public/formBuilder'))
app.use(express.static('public/submissionsPage'))
app.use(express.static('public/submitPage'))

app.get('/', function(req,res) {
	console.log("/");
	res.sendFile('index.html', {root: path.join(__dirname, './public')});
});

app.get('/index', function(req,res) {
	console.log("/index");
	res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/formBuilder', function(req,res) {
	console.log("/formBuilder");
	res.sendFile(path.join(__dirname + '/public/formBuilder/formBuilder.html'));
});

app.get('/submit', function(req,res) {
	console.log("/submit");
	res.sendFile(path.join(__dirname + '/public/submitPage/submitPage.html'));
});

app.get('/setForm', function(req, res) {
    console.log('/setForm');
    var fieldId = parseInt(req.query.fieldID);

    MongoClient.connect(mongoDBurl, function(err, db) {
		if (err) throw err;
		var dbo = db.db("forms");

		dbo.collection("forms").findOne({form_id:fieldId}, function(err, result) {
			if (err) throw err;
			res.send(result);
			db.close();
		});
	});
});

app.get('/submissions', function(req,res) {
	console.log("/submissions");
	res.sendFile(path.join(__dirname + '/public/submissionsPage/submissionsPage.html'));
});

app.get('/setTable', function(req, res) {
    console.log('/setTable');
    MongoClient.connect(mongoDBurl, function(err, db) {
		if (err) throw err;
		var dbo = db.db("forms");

		dbo.collection("forms").find({}).sort({form_id: 1}).toArray(function(err, result) {
			if (err) throw err;
			res.send(result);
			db.close();
		});
	});
});

app.get('/setSubmissionsTable', function(req, res) {
    console.log('/setSubmissionsTable');
    var fieldId = parseInt(req.query.fieldID);

	Submit.findOne(
		{ form_id:fieldId },
		'submissions',
	    function (err, submissions) {
			if (err) throw err;
			res.send(submissions);
    	}
	);
});


app.post('/save', function(req, res) {
    console.log('/save');
    MongoClient.connect(mongoDBurl, function(err, db) {
		if (err) throw err;
		var dbo = db.db("forms");
		var lastID;

		dbo.collection('forms', function(err, collection) {
			collection
				.find()
				.sort({$natural: -1})
				.limit(1)
				.next()
				.then(
				function(doc) {
					lastID = doc.form_id; //parseInt(
					lastID += 1;

					var myobj = { form_id: lastID , form_name: req.body.formname, num_submissions:0, fields: JSON.parse(req.body.tabledata), submissions: JSON.parse(req.body.inputNames) };

					dbo.collection("forms").insertOne(myobj, function(err, res) {
						if (err) throw err;
						db.close();
					});
				},
				function(err) {
					console.log('Error:', err);
				}
			);
		});
	});
});

app.post('/send', function(req, res) {
	console.log('/send');
    var fieldId = parseInt(req.body.fieldID);

	Submit.updateOne(
		{ form_id:fieldId },
		{ $inc: { num_submissions: 1 } },
		function(err, db) {
			if (err) throw err;
		}
	);

    var obj = JSON.parse(req.body.answer);
    for(var input in obj) {
    	var pushObj = {

    	}
    	var newField = 'submissions.' + input;
        pushObj[newField] = obj[input];

		Submit.updateOne(
			{ form_id:fieldId },
			{$push: pushObj},
			function(err, db) {
				if (err) throw err;
			}
		);
	}

});

const PORT = process.env.PORT || 3000;
// const PORT = 8080;
app.listen(PORT, function() {
	console.log("listen to PORT 8080");
});