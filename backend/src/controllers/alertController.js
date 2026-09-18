const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, conditionType, targetValue } = req.body;
    if (!symbol || !conditionType) {
      return res.status(400).json({ success: false, message: 'Symbol and conditionType are required' });
    }

    const alert = await Alert.create({
      userId,
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
    const userId = req.user.id;
    const { id } = req.params;
    await Alert.findOneAndDelete({ _id: id, userId });
    res.json({ success: true, message: 'Alert removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
