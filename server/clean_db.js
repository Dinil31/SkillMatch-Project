const mongoose = require('mongoose');

const uri = "mongodb+srv://dinilrandika05:gvA7mYNOQppXrbtO@cluster0.xphn5.mongodb.net/skillmatchlk?appName=Cluster0";

const KEEP_USER_IDS = [
    new mongoose.Types.ObjectId('6a0de3be375109e195814818'), // admin@skillmatch.lk
    new mongoose.Types.ObjectId('6a0de3be375109e195814819'), // worker@skillmatch.lk
    new mongoose.Types.ObjectId('6a0ec83c9449ba2090e657a1')  // dinilrandika18@gmail.com (customer)
];

async function run() {
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;

        console.log("Cleaning database...");

        // 1. Delete all users except the ones in KEEP_USER_IDS
        const userDeleteResult = await db.collection('users').deleteMany({
            _id: { $nin: KEEP_USER_IDS }
        });
        console.log(`Deleted ${userDeleteResult.deletedCount} users.`);

        // 2. Delete all worker profiles except for the worker we're keeping
        const workerProfileDeleteResult = await db.collection('workerprofiles').deleteMany({
            userId: { $ne: KEEP_USER_IDS[1] } // keeping worker@skillmatch.lk's profile
        });
        console.log(`Deleted ${workerProfileDeleteResult.deletedCount} worker profiles.`);

        // 3. Clear other collections entirely
        const collectionsToClear = [
            'gigs',
            'jobs',
            'messages',
            'reviews',
            'notifications',
            'withdrawals',
            'conversations'
        ];

        for (const collName of collectionsToClear) {
            try {
                const collection = db.collection(collName);
                if (collection) {
                    const result = await collection.deleteMany({});
                    console.log(`Deleted ${result.deletedCount} documents from '${collName}'.`);
                }
            } catch (err) {
                console.log(`Collection '${collName}' might not exist or empty.`);
            }
        }

        console.log("Database cleaned successfully!");
    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
