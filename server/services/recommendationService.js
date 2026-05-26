const WorkerProfile = require('../models/WorkerProfile');
const Job = require('../models/Job');

/**
 * Recommend workers based on category, location, ratings, and completed jobs.
 * Uses a simple weighted scoring algorithm.
 *
 * @param {object} criteria
 * @param {string} criteria.category - Job category
 * @param {string} [criteria.location] - Preferred location (city/district)
 * @param {number} [criteria.budget] - Customer's budget
 * @param {number} [criteria.limit=5] - Number of recommendations
 * @returns {Promise<Array>} Sorted list of recommended worker profiles
 */
const recommendWorkers = async ({ category, location, budget, limit = 5 }) => {
  try {
    const filter = {
      availability: 'available',
    };

    if (category) filter.category = category;

    // Fetch candidate workers
    const workers = await WorkerProfile.find(filter)
      .populate('userId', 'name profileImage isVerified status')
      .lean();

    // Filter out banned users
    const activeWorkers = workers.filter(
      (w) => w.userId && w.userId.status !== 'banned'
    );

    // Score each worker
    const scored = activeWorkers.map((worker) => {
      let score = 0;

      // Rating score (0-50 points)
      score += (worker.averageRating / 5) * 50;

      // Completed jobs score (0-20 points, capped at 100 jobs)
      score += Math.min(worker.completedJobs / 100, 1) * 20;

      // Verified bonus (10 points)
      if (worker.isVerified) score += 10;

      // Location match (15 points)
      if (location) {
        const workerLocation = `${worker.location?.city} ${worker.location?.district}`.toLowerCase();
        if (workerLocation.includes(location.toLowerCase())) {
          score += 15;
        }
      }

      // Budget compatibility (5 points)
      if (budget && worker.hourlyRate > 0) {
        if (worker.hourlyRate <= budget) {
          score += 5;
        }
      }

      return { ...worker, recommendationScore: Math.round(score) };
    });

    // Sort by score descending
    scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return scored.slice(0, limit);
  } catch (error) {
    console.error('Recommendation service error:', error);
    return [];
  }
};

/**
 * Get similar workers to a given worker (for "You might also like" section)
 * @param {string} workerId - Worker's user ID
 * @param {number} [limit=4] - Number of similar workers
 * @returns {Promise<Array>}
 */
const getSimilarWorkers = async (workerId, limit = 4) => {
  try {
    const sourceWorker = await WorkerProfile.findOne({ userId: workerId });
    if (!sourceWorker) return [];

    const similar = await WorkerProfile.find({
      userId: { $ne: workerId },
      category: sourceWorker.category,
      availability: 'available',
    })
      .populate('userId', 'name profileImage isVerified')
      .sort('-averageRating -completedJobs')
      .limit(limit)
      .lean();

    return similar.filter((w) => w.userId && w.userId.status !== 'banned');
  } catch (error) {
    console.error('Similar workers error:', error);
    return [];
  }
};

/**
 * Get trending categories based on recent job activity
 * @param {number} [limit=6] - Number of categories
 * @returns {Promise<Array>}
 */
const getTrendingCategories = async (limit = 6) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await Job.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return trending;
  } catch (error) {
    console.error('Trending categories error:', error);
    return [];
  }
};

module.exports = { recommendWorkers, getSimilarWorkers, getTrendingCategories };
