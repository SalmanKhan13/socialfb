const express = require("express");
const morgan = require('morgan');
const https = require('https');
const path = require('path');
const engine = require('ejs-mate');
const http = require('http');
const config = require('./config/config');
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const app = express();

mongoose.connect(config.db.uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Mongo db connected...')
  });
// settings
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
// static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
  res.render('index.ejs');
});


app.get('/login', (request, response) => {
  response.redirect(config.fb.auth_url);
});

app.get('/auth', (req, res) => {
  var str = req.query.code;
  // str = str.substring(0, str.length - 2);
  // console.log(str);
  let params = {
    client_id: '3302286319812448',
    client_secret: '5c8ab29b554e09d24dca484993841421',
    redirect_uri: 'https://insta.humwell.com:7777/auth',
    code: str
  };

  const data = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&');

  axios.post(`https://graph.facebook.com/v5.0/oauth/access_token?${data}`).then(response => {
    const { access_token, token_type, expires_in } = response.data;
    console.log(access_token);
    console.log('checking boy');
    // console.log(user_id);
    // console.log(str);

    User
      .findOne()
      .then(doc => {
        //if (doc.datatransfer) {
        doc.access_token = access_token;
        doc.token_type = token_type;
        doc.expires_in = expires_in;

        var objs = {};
        objs = doc;
        // total.totalrequest = doc.successfulrequest;

        User.findOneAndUpdate(
          { $set: objs }
        ).then(aall => console.log(aall));
        console.log('Data, token and Expiry_in Saved');
        res.redirect('/details');
        // }
      })
      .catch(err => {
        console.error(err)
      })
  })
    .catch((err) => {
      console.log(err);
    })
});



app.get('/details', (req, res) => {
  console.log('detail hit');
  User
    .findOne()
    .then(doc => {
      //  console.log(doc);
      const { access_token } = doc;
      //  console.log(access_token);
      axios.get(`https://graph.facebook.com/v5.0/me/accounts?access_token=${access_token}`).then(response => {
        const responses = response.data;
        console.log(responses);
        console.log('BRO R U THERE??');
        const [{ id }] = responses.data;
        console.log(id);
        axios.get(`https://graph.facebook.com/v5.0/${id}?fields=instagram_business_account&access_token=${access_token}`).then(response => {
          //res.send(response.data);
          const resp = response.data;
          const { instagram_business_account } = resp;
          const insta_id = instagram_business_account.id;
          // console.log(insta_id)
          // /media?fields=id,caption,media_type,comments,replies,username,text,media_url,like_count,owner,timestamp,comments_count
          axios.get(`https://graph.facebook.com/v5.0/${insta_id}/media?fields=id,caption,media_type,comments,replies,username,text,media_url,like_count,owner,timestamp,comments_count&access_token=${access_token}`).then(response => {
            //res.send(response.data);
            const resp = response.data;
            console.log(resp);
            res.render(resp.data);
            // res.render('profile', { resp: resp });
            //res.render('profile', resp);
          }).catch((err) => {
            console.log(err);
          })
        }).catch((err) => {
          console.log(err);
        })
      }).catch((err) => {
        console.log(err);
      })

    })
});

app.get('/subdetails', (req, res) => {
  User
    .findOne()
    .then(doc => {
      // console.log(doc);
      const { access_token } = doc;
      // console.log(access_token);
      axios.get(`https://graph.facebook.com/v5.0/100997094724288?fields=instagram_business_account&access_token=${access_token}`).then(response => {
        //res.send(response.data);
        const responses = response.data;
        console.log(responses);
        res.send(responses);
      }).catch((err) => {
        console.log(err);
      })
    })
});

const options = {
  key: fs.readFileSync('/etc/letsencrypt/archive/insta.humwell.com/privkey1.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/archive/insta.humwell.com/cert1.pem')
}

const port = process.env.PORT || 7777;
const port1 = process.env.PORT || 2222;
const server1 = http.createServer(options, app).listen(port1, function () {

  console.log("Express http server listening on port " + port1);
});
const server = https.createServer(app).listen(port, '0.0.0.0', function () {

  console.log("Express https server listening on port " + port);
});