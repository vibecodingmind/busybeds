const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    const prisma = new PrismaClient();
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // First try to find the user
        const existingUser = await prisma.user.findUnique({
            where: { email: 'admin@busybeds.com' }
        });

        let user;
        if (existingUser) {
            user = await prisma.user.update({
                where: { email: 'admin@busybeds.com' },
                data: {
                    passwordHash: hashedPassword,
                    role: 'admin',
                    fullName: 'Admin User'
                }
            });
            console.log('User updated:', user);
        } else {
            user = await prisma.user.create({
                data: {
                    email: 'admin@busybeds.com',
                    passwordHash: hashedPassword,
                    role: 'admin',
                    fullName: 'Admin User'
                }
            });
            console.log('User created:', user);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();