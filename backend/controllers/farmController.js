const Farm = require('../models/Farm');
const EggProductionLog = require('../models/EggProductionLog');

const getFarms = async (req, res, next) => {
  try {
    const farms = await Farm.find({ farmer: req.user._id });
    res.json(farms);
  } catch (error) {
    next(error);
  }
};

const createFarm = async (req, res, next) => {
  try {
    const { name, location, totalChickens, vaccinationSchedule } = req.body;
    
    if (!name || !location) {
      res.status(400);
      throw new Error('Farm name and location are required.');
    }

    const farm = new Farm({
      farmer: req.user._id,
      name,
      location,
      totalChickens,
      vaccinationSchedule
    });
    const createdFarm = await farm.save();
    res.status(201).json(createdFarm);
  } catch (error) {
    next(error);
  }
};

const updateFarm = async (req, res, next) => {
  try {
    const { name, location, totalChickens, vaccinationSchedule } = req.body;
    const farm = await Farm.findById(req.params.id);

    if (farm && farm.farmer.toString() === req.user._id.toString()) {
      farm.name = name || farm.name;
      farm.location = location || farm.location;
      farm.totalChickens = totalChickens !== undefined ? totalChickens : farm.totalChickens;
      farm.vaccinationSchedule = vaccinationSchedule || farm.vaccinationSchedule;

      const updatedFarm = await farm.save();
      res.json(updatedFarm);
    } else {
      res.status(404);
      throw new Error('Farm not found or unauthorized');
    }
  } catch (error) {
    next(error);
  }
};

const deleteFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (farm && farm.farmer.toString() === req.user._id.toString()) {
      await EggProductionLog.deleteMany({ farm: farm._id });
      await farm.deleteOne();
      res.json({ message: 'Farm removed' });
    } else {
      res.status(404);
      throw new Error('Farm not found or unauthorized');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getFarms, createFarm, updateFarm, deleteFarm };
