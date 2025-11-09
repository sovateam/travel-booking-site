// pages/auth/register.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    referralCode: 'OT7687'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateUserId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('user_id')
        .eq('phone', formData.phone)
        .single();

      if (existingUser) {
        setError('User with this phone number already exists');
        setLoading(false);
        return;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Generate user ID
      const userId = generateUserId();
      console.log('🆕 Creating user with ID:', userId);

      // Create user in database
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{
          user_id: userId,
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
          referral_code: formData.referralCode,
          status: 'pending',
          role: 'user',
          total_tasks_completed: 0,
          current_set: 1,
          current_task: 0,
          level: 0
        }])
        .select()
        .single();

      if (userError) {
        console.error('❌ User creation error:', userError);
        throw userError;
      }

      console.log('✅ User created:', user);

      // Wait a moment to ensure user is created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create unique wallet for user with specific data
      const walletData = {
        user_id: userId,
        balance: 0,
        trial_bonus: 10000,
        pending_amount: 0,
        today_points: 0,
        total_earnings: 0,
        total_withdrawn: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      };

      console.log('💰 Creating wallet with data:', walletData);

      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .insert([walletData])
        .select()
        .single();

      if (walletError) {
        console.error('❌ Wallet creation error:', walletError);
        
        // If wallet creation fails, delete the user to avoid orphaned records
        await supabase
          .from('users')
          .delete()
          .eq('user_id', userId);
          
        throw new Error(`Wallet creation failed: ${walletError.message}`);
      }

      console.log('✅ Wallet created:', wallet);

      // Verify the wallet was created
      const { data: verifyWallet, error: verifyError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (verifyError) {
        console.error('❌ Wallet verification error:', verifyError);
        throw new Error('Failed to verify wallet creation');
      }

      console.log('✅ Wallet verified:', verifyWallet);

      // Show success message
      alert(`Registration successful! Your User ID is: ${userId}. Please wait for admin approval.`);
      
      // Redirect to login
      router.push('/auth/login');

    } catch (error) {
      console.error('❌ Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          Create Account
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '24px'
        }}>
          Join One Travel Working
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Enter your full name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Enter your phone number"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Create a password"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Referral Code
            </label>
            <input
              type="text"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#f9fafb'
              }}
              placeholder="Enter referral code"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Already have an account?{' '}
          <a 
            href="/auth/login" 
            style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}