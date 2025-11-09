// pages/auth/login.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

export default function Login() {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('');

    try {
      console.log('🔍 Searching for user with phone:', formData.phone);

      // First, find user by phone number (without password check)
      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', formData.phone);

      if (searchError) {
        console.error('Search error:', searchError);
        throw searchError;
      }

      console.log('📋 Found users:', users);

      if (!users || users.length === 0) {
        setError('No user found with this phone number');
        setDebugInfo('No users found in database with this phone number');
        return;
      }

      const user = users[0];
      console.log('👤 User found:', user);
      console.log('🔑 Input password:', formData.password);
      console.log('💾 Stored password:', user.password);

      // Check password
      if (user.password !== formData.password) {
        setError('Invalid password');
        setDebugInfo(`Password mismatch. Stored: "${user.password}", Input: "${formData.password}"`);
        return;
      }

      // Check status
      if (user.status !== 'approved') {
        setError(`Your account is ${user.status}. Please wait for admin approval.`);
        setDebugInfo(`User status: ${user.status}`);
        return;
      }

      console.log('✅ Login successful for user:', user.name);

      // Store user data
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'dummy-token');

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user/dashboard');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Login failed. Please try again.');
      setDebugInfo(`Error: ${error.message}`);
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
          Welcome Back
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '24px'
        }}>
          Sign in to your account
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
            <strong>Error:</strong> {error}
          </div>
        )}

        {debugInfo && (
          <div style={{
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            color: '#374151',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <strong>Debug:</strong> {debugInfo}
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

          <div style={{ marginBottom: '24px' }}>
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
              placeholder="Enter your password"
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Don't have an account?{' '}
          <a 
            href="/auth/register" 
            style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Sign Up
          </a>
        </p>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0369a1'
        }}>
          <strong>Test Credentials:</strong><br />
          Admin: 9999999999 / any password<br />
          New users: Use the phone number you registered with
        </div>
      </div>
    </div>
  );
}