const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  access_token: {
    type: String
  },
  token_type: {
    type: String
  },
  expires_in: {
    type: Number
  }
});

module.exports = User = mongoose.model('user', UserSchema);
