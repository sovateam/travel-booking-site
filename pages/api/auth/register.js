import { readData, writeData } from '../../utils/db';

// Simple hash function for development
const simpleHash = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString();
};

export default function handler(req, res) {
    console.log('📝 Registration API called');

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, phone, password, referralCode } = req.body;

    console.log('📝 Registration attempt:', { name, phone, referralCode });

    if (!name || !phone || !password || !referralCode) {
        console.log('❌ Missing fields');
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check referral code
    if (referralCode !== 'OT7687') {
        console.log('❌ Invalid referral code');
        return res.status(400).json({ message: 'Invalid referral code' });
    }

    try {
        // Read current users with enhanced error handling
        let users = [];
        try {
            users = readData('users.json');
            console.log('👥 Current users before registration:', users.length);
        } catch (error) {
            console.log('🆕 Creating new users array');
            users = [];
        }

        // Check if user already exists
        const existingUser = users.find(user => user.phone === phone);
        if (existingUser) {
            console.log('❌ User already exists:', phone);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate user ID based on date (6 digits)
        const userId = Date.now().toString().slice(-6);

        const newUser = {
            id: userId,
            name,
            phone,
            password: simpleHash(password),
            status: 'pending',
            role: 'user',
            createdAt: new Date().toISOString(),
            isFirstTime: true, // New field to track first-time users
            wallet: {
                taskCount: 0,
                bonusPoints: 0,
                pointBalance: 0,
                pendingPoints: 0,
                todayPoints: 0,
                trialBonus: 10000, // Trial bonus added immediately
                totalDeposit: 0,
                totalWithdraw: 0
            }
        };

        users.push(newUser);

        // Save with enhanced error handling
        const saveResult = writeData('users.json', users);
        if (!saveResult) {
            throw new Error('Failed to save user data');
        }

        console.log('✅ User registered successfully:', newUser.name);
        console.log('👥 Total users after registration:', users.length);

        // Verify the save worked
        const verifyUsers = readData('users.json');
        console.log('🔍 Verification - users in database:', verifyUsers.length);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Waiting for admin approval.',
            userId: userId
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}