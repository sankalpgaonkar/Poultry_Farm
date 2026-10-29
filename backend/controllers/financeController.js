const calculateProfit = async (req, res, next) => {
  try {
    const { 
      birdsCount, 
      dailyFeedKg, 
      feedCostPerKg, 
      dailyEggProduction, 
      eggSalePrice, 
      laborCostDaily, 
      utilitiesCostDaily 
    } = req.body;

    // Validation
    const fields = [birdsCount, dailyFeedKg, feedCostPerKg, dailyEggProduction, eggSalePrice, laborCostDaily, utilitiesCostDaily];
    if (fields.some(f => f === undefined || isNaN(f) || f < 0)) {
      res.status(400);
      throw new Error('All inputs must be valid non-negative numbers.');
    }

    const totalFeedCost = dailyFeedKg * feedCostPerKg;
    const totalDailyCost = totalFeedCost + laborCostDaily + utilitiesCostDaily;
    const totalDailyRevenue = dailyEggProduction * eggSalePrice;
    const dailyProfit = totalDailyRevenue - totalDailyCost;
    
    const costPerEgg = dailyEggProduction > 0 ? (totalDailyCost / dailyEggProduction) : 0;
    const breakEvenEggs = eggSalePrice > 0 ? Math.ceil(totalDailyCost / eggSalePrice) : 0;
    
    let suggestions = [];
    if (dailyProfit < 0) {
      suggestions.push('You are currently operating at a loss. Try reducing feed waste or negotiating better bulk feed prices.');
    } else if (dailyProfit > 0 && dailyProfit < totalDailyCost * 0.1) {
      suggestions.push('Profit margin is quite low (< 10%). Optimize labor or utility usage.');
    }
    
    if (costPerEgg > (eggSalePrice * 0.8)) {
      suggestions.push('Cost per egg is dangerously close to your selling price. Consider increasing your selling price, or switching to higher yielding bird breeds.');
    }
    
    let feedEfficiency = dailyEggProduction > 0 ? (dailyFeedKg / dailyEggProduction) : 0;
    if (feedEfficiency > 0.16) {
      suggestions.push(`High feed conversion ratio (${feedEfficiency.toFixed(2)} kg feed per egg). Normal is ~0.12 - 0.14. Check for feed spillage or rodent issues.`);
    }

    res.json({
      breakdown: {
        totalDailyCost: totalDailyCost.toFixed(2),
        totalDailyRevenue: totalDailyRevenue.toFixed(2),
        dailyProfit: dailyProfit.toFixed(2),
        costPerEgg: costPerEgg.toFixed(2),
        breakEvenEggs
      },
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { calculateProfit };
