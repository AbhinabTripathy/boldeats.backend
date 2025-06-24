require('dotenv').config();
const { User } = require('../models');
const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({
            where: { email: 'admin@boldeats.in' }
        });

        if (existingAdmin) {
            // Delete the existing admin user
            await existingAdmin.destroy();
            console.log('Existing admin user deleted');
        }

        // Create admin user with uppercase ADMIN role
        const hashedPassword = await bcrypt.hash('admin@boldeats@2k25', 10);
        
        await User.create({
            name: 'admin@boldeats',
            email: 'admin@boldeats.in',
            password: hashedPassword,
            phone_number: '9876543210', 
            role: 'ADMIN'  // Using uppercase ADMIN
        });

        console.log('Admin user created successfully with role ADMIN');
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        process.exit();
    }
}

createAdmin();