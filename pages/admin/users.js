// pages/admin/users.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    fetchUsersData();
    setupRealtimeSubscriptions();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their wallet, progress, and task data
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          *,
          wallets(balance),
          user_tasks(status),
          user_premium_tasks(status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(usersData || []);
      
      // Calculate stats
      const stats = {
        total: usersData?.length || 0,
        active: usersData?.filter(u => u.status === 'approved').length || 0,
        pending: usersData?.filter(u => u.status === 'pending').length || 0
      };
      setUserStats(stats);

    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Real-time subscription for user updates
    const userSubscription = supabase
      .channel('admin-users-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('🔄 User update:', payload);
          fetchUsersData(); // Refresh data
        }
      )
      .subscribe();

    // Real-time subscription for wallet updates
    const walletSubscription = supabase
      .channel('admin-wallets-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets'
        },
        (payload) => {
          console.log('💰 Wallet update:', payload);
          // Update specific user's wallet balance
          setUsers(prev => prev.map(user => 
            user.user_id === payload.new.user_id 
              ? { 
                  ...user, 
                  wallets: [{ balance: payload.new.balance }] 
                }
              : user
          ));
        }
      )
      .subscribe();

    // Real-time subscription for task updates
    const taskSubscription = supabase
      .channel('admin-tasks-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_tasks'
        },
        (payload) => {
          console.log('📝 Task update:', payload);
          fetchUsersData(); // Refresh to get updated counts
        }
      )
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      walletSubscription.unsubscribe();
      taskSubscription.unsubscribe();
    };
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      alert(`User ${newStatus} successfully!`);
      fetchUsersData();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user: ' + error.message);
    }
  };

  const getCompletedTasksCount = (user) => {
    const regularCompleted = user.user_tasks?.filter(t => t.status === 'completed').length || 0;
    const premiumCompleted = user.user_premium_tasks?.filter(t => t.status === 'completed').length || 0;
    return regularCompleted + premiumCompleted;
  };

  const getActivePremiumTasks = (user) => {
    return user.user_premium_tasks?.filter(t => 
      t.status === 'assigned' || t.status === 'in_progress'
    ).length || 0;
  };

  if (loading) {
    return (
      <AdminLayout activeTab="users">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div>Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="users">
      <div style={{ padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
            User Management
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
            Manage users, track progress, and monitor activity.
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }}>👥</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Total Users</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{userStats.total}</p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#10b981', marginBottom: '8px' }}>✅</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Active Users</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{userStats.active}</p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '8px' }}>⏳</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Pending Approval</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{userStats.pending}</p>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                    User
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                    Progress
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                    Wallet
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                    Tasks
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                    Status
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.user_id} style={{ borderBottom: index < users.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                          {user.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                          {user.email}
                        </p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                          ID: {user.user_id}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                          Set {user.current_set || 1} • Task {user.current_task || 1}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                          {getCompletedTasksCount(user)} tasks completed
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#10b981', margin: 0 }}>
                        ₹{user.wallets?.[0]?.balance || 0}
                      </p>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                          {user.user_tasks?.length || 0} Regular
                        </span>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', backgroundColor: '#fef3c7', color: '#92400e' }}>
                          {getActivePremiumTasks(user)} Premium
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: user.status === 'approved' ? '#dcfce7' : 
                                       user.status === 'pending' ? '#fef9c3' : '#fecaca',
                        color: user.status === 'approved' ? '#166534' : 
                              user.status === 'pending' ? '#854d0e' : '#dc2626'
                      }}>
                        {user.status === 'approved' && '✅ Approved'}
                        {user.status === 'pending' && '⏳ Pending'}
                        {user.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(user.user_id, 'approved')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(user.user_id, 'rejected')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(user.user_id, 'rejected')}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 8px 0' }}>
                No users found
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Users will appear here once they register.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
