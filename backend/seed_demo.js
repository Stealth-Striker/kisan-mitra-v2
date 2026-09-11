const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let farmer = db.users.findOne(u => u.email === 'farmer@kisanmitra.local');
if (!farmer) {
  farmer = db.users.insert({
    id: uuidv4(),
    email: 'farmer@kisanmitra.local',
    password_hash: bcrypt.hashSync('farmer123', 10),
    full_name: 'Ramesh Kumar',
    role: 'user',
    phone: '+91 98765 43210',
    is_verified: true,
    notification_prefs: JSON.stringify({ harvest: true, disease: true, market: true }),
    created_date: new Date().toISOString()
  });
  console.log('Created farmer@kisanmitra.local');
} else {
  console.log('farmer@kisanmitra.local exists');
}

let farm = db.farms.findOne(f => f.created_by_id === farmer.id);
if (!farm) {
  db.farms.insert({
    id: uuidv4(),
    created_by_id: farmer.id,
    name: 'Green Valley Paddy Farm',
    location: 'Varikoli',
    district: 'Ernakulam',
    state: 'Kerala',
    crop: 'Rice',
    primary_crop: 'Rice',
    farm_size: 2.5,
    farm_size_unit: 'Acres',
    acreage: 2.5,
    soil_type: 'Clay Loam',
    sowing_date: '2026-06-15',
    language: 'English',
    farmer_since: '2018',
    created_date: new Date().toISOString()
  });
  console.log('Created demo farm');
} else {
  console.log('Demo farm exists');
}
