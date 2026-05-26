const mongoose = require('mongoose');

const uri = "mongodb+srv://dinilrandika05:gvA7mYNOQppXrbtO@cluster0.xphn5.mongodb.net/skillmatchlk?appName=Cluster0";

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const users = await db.collection('users').find({}).toArray();
    console.log("USERS:");
    users.forEach(u => console.log(`${u._id} | ${u.role} | ${u.name} | ${u.email} | createdAt: ${u.createdAt}`));
    
    await mongoose.disconnect();
}

run().catch(console.error);
