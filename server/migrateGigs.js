const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Gig = require('./models/Gig');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB connected');
    const result = await Gig.updateMany(
        { approvalStatus: { $exists: false } },
        { $set: { approvalStatus: 'approved' } }
    );
    console.log(`Updated ${result.modifiedCount} gigs`);
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
