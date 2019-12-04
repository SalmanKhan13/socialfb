var in_client_id = '3302286319812448',
  in_client_secret = '5c8ab29b554e09d24dca484993841421',
  in_redirect_uri = 'https://insta.humwell.com:7777/auth',
  in_auth_url = 'https://www.facebook.com/v5.0/dialog/oauth?client_id=' + in_client_id +
    '&redirect_uri=' + in_redirect_uri + '&state={st=state123abc,ds=123456789}';


var db_user = 'salman',
  db_password = 'salman11',
  db_uri = 'mongodb://'
    + db_user + ':'
    + db_password + '@ds051740.mlab.com:51740/devconnector1';

module.exports = {

  db: {
    uri: db_uri
  },
  fb: {
    client_id: in_client_id,
    client_secret: in_client_secret,
    auth_url: in_auth_url
  }
};