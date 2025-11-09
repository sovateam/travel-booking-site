import { readData, writeData } from '../utils/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-in-production';

export default function handler(req, res) {
    console.log('👥 Admin Users API called:', req.method);

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Read users with enhanced error handling
        let users = [];
        try {
            users = readData('users.json');
            console.log('📊 Total users in database:', users.length);
        } catch (error) {
            console.log('❌ Error reading users:', error);
            users = [];
        }

        // Check if user is admin
        const currentUser = users.find(u => u.id === decoded.userId);
        if (!currentUser || currentUser.role !== 'admin') {
            console.log('❌ Access denied - not admin');
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.method === 'GET') {
            // Return all users without passwords, ensure wallet exists
            const usersWithoutPasswords = users.map(({ password, ...user }) => {
                // Ensure wallet exists with all fields
                if (!user.wallet) {
                    user.wallet = {
                        taskCount: 0,
                        bonusPoints: 0,
                        pointBalance: 0,
                        pendingPoints: 0,
                        todayPoints: 0,
                        trialBonus: 10000,
                        totalDeposit: 0,
                        totalWithdraw: 0
                    };
                }
                return user;
            });

            console.log('✅ Sending users to admin:', usersWithoutPasswords.length);
            res.status(200).json(usersWithoutPasswords);

        } else if (req.method === 'PUT') {
            const { userId, status } = req.body;

            console.log('🔄 Updating user status:', { userId, status });

            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                console.log('❌ User not found:', userId);
                return res.status(404).json({ message: 'User not found' });
            }

            if (status === 'deleted') {
                console.log('🗑️ Deleting user:', users[userIndex].name);
                users.splice(userIndex, 1);
            } else {
                console.log('✅ Updating user status:', users[userIndex].name, '→', status);
                users[userIndex].status = status;
            }

            writeData('users.json', users);
            res.status(200).json({ message: 'User updated successfully' });
        }
    } catch (error) {
        console.error('❌ Token verification failed:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
}