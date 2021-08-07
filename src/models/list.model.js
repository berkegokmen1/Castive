const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({});

const List = mongoose.model('List', listSchema);

module.exports = List;
