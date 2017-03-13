const express = require('express');
const bodyParser= require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const $ = require('jquery');
const ObjectId = require('mongodb').ObjectID;
const request = require("request");
const moment = require("moment");
pry = require('pryjs');

require('dotenv').load();
const app = express();
app.use(express.static('public'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

let db;
MongoClient.connect("mongodb://" + process.env.Snowvation_Username + ":" + process.env.Snowvation_Password  + "@ds129010.mlab.com:29010/playground", (err, database) => {
  if (err) return console.log(err);
    db = database;
    app.listen(process.env.PORT || 3000, () => {
      console.log('listening on 3000');
    });
});

app.get('/', (req, res) => {
  db.collection('mountains').find().toArray((err, result) => {
    if (err) return console.log(err);
    // renders index.ejs
    res.render('index.ejs', {mountains: result});
  });
});

app.get('/results/:_id', (req, res) => {
  const id = req.params._id;
  console.log(id);
  db.collection('go').findOne({_id: ObjectId(id)}, (err, result) => {
    res.render('results.ejs', {result: result});
  });
});


app.post('/results', (req, res) => {
  const formattedDestination = req.body.destination.replace(' ', '+');
  request({
    url: "https://api.worldweatheronline.com/premium/v1/ski.ashx",
    method: "GET",
    qs: {format: 'json',
        key: process.env.WeatherWorld_Key,
        q: formattedDestination,
        num_of_days: 1
    }}, function(err, response, body) {
      if(err) return console.log('ERROR', err);
      const bodyData = JSON.parse(body).data;
      if (bodyData.error) {
        return console.log('Error', bodyData.error);
      }
      const weather = bodyData.weather[0];
      req.body.chanceOfSnow = weather.chanceofsnow;
      req.body.minTemp = weather.top[0].mintempF;
      req.body.maxTemp = weather.top[0].maxtempF;
      req.body.snowFallCM = weather.totalSnowfall_cm;
      const hour = parseInt(req.body.time, 10) + 1;
      const unixTime = moment().hour(hour).unix();
      const rawOrigin = req.body.city + ',' + req.body.state + ',' + req.body.zip; 
      const formattedOrigin = rawOrigin.replace(' ', '+');

      request({
        url: "https://maps.googleapis.com/maps/api/directions/json",
        method: "GET",
        qs: {
          key: process.env.GOOGLE_Key,
          mode: "driving",
          departure_time: unixTime + "",
          destination: formattedDestination,
          origin: formattedOrigin
        }
      }, function (err, response, body) {
        if(err) return console.log('Error', err);
        const trip = JSON.parse(body);
        req.body.warnings = [];
        if (trip.routes[0] && trip.routes[0].warnings ) {
          req.body.warnings = trip.routes[0].warnings;
        }
        
        req.body.travel_time = trip.routes[0].legs[0].duration.text;
        const anyTraffic = trip.routes[0].legs[0];
        req.body.duration_in_traffic = "No Traffic Delays";
        if (anyTraffic.duration_in_traffic) {
          req.body.duration_in_traffic = anyTraffic.duration_in_traffic.text;
        }
        db.collection('go').save(req.body, (err, result) => {
          if (err) return console.log(err);

          console.log('saved to database');
          const _id = result.ops[0]._id;

          res.redirect('/results/' + _id);
        });
      });

    }
  );
});