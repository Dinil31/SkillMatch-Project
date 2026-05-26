require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/Review');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillmatchlk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const latestReview = await Review.findOne().sort('-createdAt');
  console.log('Latest review comment:', latestReview.comment);
  console.log('Latest review images:', latestReview.images);
  process.exit(0);
});
