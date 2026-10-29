// Mock rule-based logic for Health Intelligence
const analyzeHealth = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      res.status(400);
      throw new Error('Symptoms must be provided as a non-empty array.');
    }
    
    // Knowledge Base
    const diseaseDB = [
      {
        name: 'Avian Influenza (Bird Flu)',
        symptoms: ['sneezing', 'coughing', 'drop in eggs', 'swollen head', 'purple wattles'],
        riskLevel: 'Critical',
        action: 'Immediately isolate affected birds, contact local veterinary authorities. High mortality risk.'
      },
      {
        name: 'Newcastle Disease',
        symptoms: ['gasping', 'sneezing', 'twisted neck', 'paralysis', 'drop in eggs'],
        riskLevel: 'High',
        action: 'Isolate flock. No cure, but preventable via vaccination. Use supportive antibiotics for secondary infections.'
      },
      {
        name: 'Coccidiosis',
        symptoms: ['bloody diarrhea', 'lethargy', 'pale comb', 'weight loss'],
        riskLevel: 'High',
        action: 'Treat water with Amprolium or Sulfa drugs. Keep litter dry.'
      },
      {
        name: 'Infectious Bronchitis',
        symptoms: ['sneezing', 'snoring', 'watery eyes', 'drop in eggs', 'misshapen eggs'],
        riskLevel: 'Medium',
        action: 'Increase brooder temperature slightly. Provide vitamins in water.'
      },
      {
        name: 'Heat Stress',
        symptoms: ['panting', 'pale comb', 'lethargy', 'drop in eggs', 'increased thirst'],
        riskLevel: 'Medium',
        action: 'Provide cold water, add electrolytes. Ensure good ventilation. Avoid feeding during hottest hours.'
      }
    ];

    let matches = [];
    diseaseDB.forEach(disease => {
      let matchCount = 0;
      disease.symptoms.forEach(s => {
        if (symptoms.some(userSymptom => userSymptom.toLowerCase().includes(s.toLowerCase()))) matchCount++;
      });
      if (matchCount > 0) {
        matches.push({
          disease: disease.name,
          confidence: Math.round((matchCount / disease.symptoms.length) * 100),
          riskLevel: disease.riskLevel,
          action: disease.action
        });
      }
    });

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    if (matches.length === 0 && symptoms.length > 0) {
      matches.push({
        disease: 'Unknown Condition',
        confidence: 0,
        riskLevel: 'Low',
        action: 'Monitor the flock closely. Consult a local vet if symptoms persist for > 2 days.'
      });
    }

    res.json(matches);
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeHealth };
