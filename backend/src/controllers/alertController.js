const Alert = require('../models/Alert');

const DEFAULT_USER_ID = 'default_guest';

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: DEFAULT_USER_ID }).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { symbol, conditionType, targetValue } = req.body;
    if (!symbol || !conditionType) {
      return res.status(400).json({ success: false, message: 'Symbol and conditionType are required' });
    }

    const alert = await Alert.create({
      userId: DEFAULT_USER_ID,
      symbol: symbol.toUpperCase().trim(),
      conditionType,
      targetValue: targetValue || 80
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await Alert.findByIdAndDelete(id);
    res.json({ success: true, message: 'Alert removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
