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

app.get('/loginn', (request, response) => {
  response.redirect(config.instagram.auth_url);
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
        //console.log(responses);
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
          //17841407469741005?fields=biography,followers_count,follows_count,media_count,profile_picture_url,username,website,name
          axios.get(`https://graph.facebook.com/v5.0/${insta_id}/media?fields=id,caption,media_type,comments,replies,username,text,media_url,like_count,owner,timestamp,comments_count,children&access_token=${access_token}`).then(response => {
            const resp = response.data;
            // console.log(resp);
            const respp = resp.data;
            var lchildren = respp.map(function (data) {
              return data.children
            })
            console.log(lchildren);
            const { id: [id] } = lchildren;
            console.log(id)
            res.send(resp);

            // axios.get(`https://graph.facebook.com/v5.0/${insta_id}?fields=biography,followers_count,follows_count,media_count,profile_picture_url,username,website,name&access_token=${access_token}`).then(response => {
            //   const respdetails = response.data;


            //   res.render('profile', { resp: resp, respdetails: respdetails });
            // }).catch((err) => {
            //   console.log(err);
            // })
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

app.get('/handleauth', (req, res) => {
  var str = req.query.code;
  // str = str.substring(0, str.length - 2);
  // console.log(str);
  let params = {
    app_id: '445969309446550',
    app_secret: '291958d2c06000112ee51d34657b6beb',
    grant_type: 'authorization_code',
    redirect_uri: 'https://insta.humwell.com:7777/handleauth',
    code: str
  };

  const data = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&');

  axios.post('https://api.instagram.com/oauth/access_token', data, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
  }).then(response => {
    const { access_token, user_id } = response.data;
    console.log(access_token);
    console.log('checking boy');
    console.log(user_id);
    console.log(str);

    User
      .findOne()
      .then(doc => {
        //if (doc.datatransfer) {
        doc.access_token = access_token;
        doc.user_id = user_id;
        doc.code = str
        var objs = {};
        objs = doc;
        // total.totalrequest = doc.successfulrequest;

        User.findOneAndUpdate(
          { $set: objs }
        ).then(aall => console.log(aall));
        console.log('Data, token and ID Saved');
        // }
      })
      .catch(err => {
        console.error(err)
      })

    axios.get(`https://graph.instagram.com/me?fields=id,account_type,media_count,username&access_token=${access_token}`).then(response => {
      //res.send(response.data);
      const responses = response.data;
      res.redirect('detail');

    }).catch((err) => {
      console.log(err);
    })

  })
    .catch((err) => {
      console.log(err);
    })
});


app.get('/detail', (req, res) => {
  User
    .findOne()
    .then(doc => {
      console.log(doc);
      const { access_token } = doc;
      console.log(access_token);
      axios.get(`https://graph.instagram.com/me?fields=id,account_type,media_count,username&access_token=${access_token}`).then(response => {
        //res.send(response.data);
        const responses = response.data;
        console.log(responses);
        axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url,timestamp&access_token=${access_token}`).then(response => {
          //res.send(response.data);
          const resdata = response.data;
          res.render('profileInsta', { detail: responses, resdata: resdata });
        }).catch((err) => {
          console.log(err);
        });
      }).catch(err => {
        console.log(err);
      })

    }).catch((err) => {
      console.log(err);
    });
})






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

app.get('/test', (req, res) => {

  const datas = [{
    "id": "17858685283626158",
    "caption": "Sent via @planoly #planoly",
    "media_type": "IMAGE",
    "username": "salman919241",
    "media_url": "https://scontent.xx.fbcdn.net/v/t51.2885-15/75259561_2404094773032686_8558722210709298861_n.jpg?_nc_cat=100&_nc_ohc=vOG25btVDbcAQkwCzHfn-hTHH1oQbDDijcMeMArxmmQUmcAVeyZeAHSZA&_nc_ht=scontent.xx&oh=4760c13ead0125bc6298b1d0b01d8c88&oe=5E6A8CF5",
    "like_count": 0,
    "owner": {
      "id": "17841407469741005"
    },
    "timestamp": "2019-12-02T07:45:03+0000",
    "comments_count": 0
  },
  {
    "id": "17844814216791022",
    "caption": "NxN stars",
    "media_type": "CAROUSEL_ALBUM",
    "comments": {
      "data": [
        {
          "timestamp": "2019-12-04T10:22:26+0000",
          "text": "Wow",
          "id": "17853058687700796"
        }
      ]
    },
    "username": "salman919241",
    "media_url": "https://scontent.xx.fbcdn.net/v/t51.2885-15/72298092_571312023697963_8307006223278342881_n.jpg?_nc_cat=107&_nc_ohc=JY_scP8S5KIAQk2Q-zJnKr_e-rnSancqt2ewgj0aCdv764aoO0gTfe9tA&_nc_ht=scontent.xx&oh=6f5f334960c788eccf09d8aa21e4c3a5&oe=5E414230",
    "like_count": 2,
    "owner": {
      "id": "17841407469741005"
    },
    "timestamp": "2019-11-27T07:46:34+0000",
    "comments_count": 1,
    "children": {
      "data": [
        {
          "id": "17867753935534193"
        },
        {
          "id": "17846592811783236"
        },
        {
          "id": "18081926122184888"
        },
        {
          "id": "17913302722369024"
        }
      ]
    }
  },
  {
    "id": "17847455002756953",
    "caption": "Friends forever",
    "media_type": "IMAGE",
    "username": "salman919241",
    "media_url": "https://scontent.xx.fbcdn.net/v/t51.2885-15/75477038_745567999282211_7628922032970417446_n.jpg?_nc_cat=111&_nc_ohc=U4ghigAYq4EAQktOTpXK6sJ4rzT-3Bf3-d395bNXA4OKEVh5c4tSeo5qA&_nc_ht=scontent.xx&oh=4748250f5ba234a7b26ad06f1aa19497&oe=5E7A3D52",
    "like_count": 2,
    "owner": {
      "id": "17841407469741005"
    },
    "timestamp": "2019-11-26T11:55:59+0000",
    "comments_count": 0
  },
  {
    "id": "17890510441429104",
    "caption": "Office time with a cup of tea",
    "media_type": "IMAGE",
    "comments": {
      "data": [
        {
          "timestamp": "2019-12-05T05:58:48+0000",
          "text": "Hello guys...... like this post as i am testing",
          "id": "18084360091138721"
        },
        {
          "timestamp": "2019-12-04T10:22:58+0000",
          "text": "Mac would have been better",
          "id": "18084384616140257"
        }
      ]
    },
    "username": "salman919241",
    "media_url": "https://scontent.xx.fbcdn.net/v/t51.2885-15/71890359_532588703986197_4532628307940270365_n.jpg?_nc_cat=102&_nc_ohc=O344jyqanygAQl--rC_nFI9Nx-33I-UsU4UXxk5c8KT0LmL3Dyvrr7TrQ&_nc_ht=scontent.xx&oh=550d1656b602af8a1eb865d46317684e&oe=5E40063B",
    "like_count": 4,
    "owner": {
      "id": "17841407469741005"
    },
    "timestamp": "2019-11-14T09:15:16+0000",
    "comments_count": 4
  }
  ];

  var lchildren = datas.map((data) => {
    return data.children
  })
  console.log(lchildren);

  const rchildren = lchildren.map(function (data) {
    return data;
  })
  console.log(rchildren);
  res.send(lchildren);
});



const options = {
  key: fs.readFileSync('/etc/letsencrypt/archive/insta.humwell.com/privkey1.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/archive/insta.humwell.com/cert1.pem')
}

const port = process.env.PORT || 7777;
const port1 = process.env.PORT || 2222;
const server1 = http.createServer(app).listen(port1, function () {

  console.log("Express http server listening on port " + port1);
});
const server = https.createServer(options, app).listen(port, '0.0.0.0', function () {

  console.log("Express https server listening on port " + port);
});