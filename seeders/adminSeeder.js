const bcrypt = require('bcrypt');
const { User } = require('../models');
const sequelize = require('../config/db');

async function seedAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database for admin seeding');
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({
            where: { email: 'admin@boldeats.com', role: 'ADMIN' }
        });
        
        if (existingAdmin) {
            console.log('Admin user already exists, skipping creation');
            return;
        }
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@boldeats.com',
            phone_number: '9876543210',
            password: hashedPassword,
            role: 'ADMIN',
            isVerified: true
        });
        
        console.log('Admin user created successfully:', admin.name);
        
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
    seedAdmin()
        .then(() => {
            console.log('Admin seeding completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Admin seeding failed:', err);
            process.exit(1);
        });
}

module.exports = seedAdmin;