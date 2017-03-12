const express = require('express');
const bodyParser= require('body-parser');
const MongoClient = require('mongodb').MongoClient;
pry = require('pryjs');

require('dotenv').load();
const app = express();

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

var db
MongoClient.connect("mongodb://" + process.env.Snowvation_Username + ":" + process.env.Snowvation_Password  + "@ds129010.mlab.com:29010/playground", (err, database) => {
  if (err) return console.log(err);
    db = database;
    app.listen(3000, () => {
      console.log('listening on 3000');
    });
});

app.get('/', (req, res) => {
  db.collection('quotes').find().toArray((err, result) => {
    if (err) return console.log(err);
    // renders index.ejs
    res.render('index.ejs', {quotes: result});
  })
})



app.post('/quotes', (req, res) => {
  db.collection('quotes').save(req.body, (err, result) => {
    if (err) return console.log(err)

    console.log('saved to database')
    res.redirect('/')
  })
})