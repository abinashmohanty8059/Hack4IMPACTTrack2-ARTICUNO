import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const PROFILE_PATH = path.resolve('doctor_profile.json');

// GET Profile
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(PROFILE_PATH, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// UPDATE Profile
router.put('/', async (req, res) => {
  try {
    const updatedData = req.body;
    await fs.writeFile(PROFILE_PATH, JSON.stringify(updatedData, null, 2));
    res.json({ message: "Profile updated successfully", data: updatedData });
  } catch (err) {
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;
