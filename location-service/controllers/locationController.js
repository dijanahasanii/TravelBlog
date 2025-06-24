const Location = require("../models/Location");

// Get all locations
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new location (optional/admin)
exports.addLocation = async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Location.findOne({ name });
    if (existing) return res.status(400).json({ message: "Already exists" });

    const location = new Location({ name });
    await location.save();
    res.status(201).json({ message: "Location added", location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
