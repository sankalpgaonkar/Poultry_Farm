const EggProductionLog = require('../models/EggProductionLog');
const Farm = require('../models/Farm');

const getLogs = async (req, res, next) => {
  try {
    const farms = await Farm.find({ farmer: req.user._id });
    const farmIds = farms.map(f => f._id);
    
    const logs = await EggProductionLog.find({ farm: { $in: farmIds } }).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

const createLog = async (req, res, next) => {
  try {
    const { farmId, date, totalEggs, temperature, humidity, feedConsumed, mortalityCount, currentChickenCount } = req.body;
    
    if (!farmId || totalEggs === undefined) {
      res.status(400);
      throw new Error('Farm ID and Total Eggs count are required.');
    }

    const farm = await Farm.findById(farmId);
    if (!farm || farm.farmer.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Farm not found or unauthorized');
    }

    const log = new EggProductionLog({
      farm: farmId,
      farmer: req.user._id,
      date: date || Date.now(),
      totalEggs,
      temperature,
      humidity,
      currentChickenCount: currentChickenCount || farm.totalChickens,
      feedConsumed,
      mortalityCount
    });

    if (currentChickenCount) {
      farm.totalChickens = currentChickenCount;
      await farm.save();
    } else if (mortalityCount && mortalityCount > 0) {
      farm.totalChickens = Math.max(0, farm.totalChickens - mortalityCount);
      await farm.save();
    }

    const createdLog = await log.save();
    res.status(201).json(createdLog);
  } catch (error) {
    next(error);
  }
};

module.exports = { getLogs, createLog };
