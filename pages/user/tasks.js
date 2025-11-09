// pages/user/tasks.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

export default function UserTasksPage() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [premiumTasks, setPremiumTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('regular');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        fetchUserTasks(userObj.user_id);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  }, []);

  const fetchUserTasks = async (userId) => {
    try {
      setLoading(true);

      // Fetch regular tasks
      const { data: regularTasks, error: regularError } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('set_number', { ascending: true })
        .order('task_number', { ascending: true });

      if (regularError) throw regularError;

      // Fetch premium tasks assigned to this user
      const { data: premiumTasksData, error: premiumError } = await supabase
        .from('user_premium_tasks')
        .select(`
          *,
          premium_config(
            description,
            instructions,
            requirements,
            task_type,
            difficulty
          )
        `)
        .eq('user_id', userId)
        .in('status', ['assigned', 'in_progress'])
        .order('assigned_at', { ascending: true });

      if (premiumError) throw premiumError;

      setTasks(regularTasks || []);
      setPremiumTasks(premiumTasksData || []);

    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Error loading tasks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId, isPremium = false) => {
    try {
      if (isPremium) {
        // Update premium task status to in_progress
        const { error } = await supabase
          .from('user_premium_tasks')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
      } else {
        // Update regular task status to in_progress
        const { error } = await supabase
          .from('user_tasks')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
      }

      alert('Task started! You can now complete the task requirements.');
      fetchUserTasks(user.user_id);
    } catch (error) {
      console.error('Error starting task:', error);
      alert('Error starting task: ' + error.message);
    }
  };

  const handleCompleteTask = async (taskId, isPremium = false) => {
    if (!confirm('Have you completed all the task requirements?')) {
      return;
    }

    try {
      if (isPremium) {
        // For premium tasks, mark as completed (admin will verify)
        const { error } = await supabase
          .from('user_premium_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
      } else {
        // For regular tasks, mark as completed
        const { error } = await supabase
          .from('user_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
      }

      alert('Task completed successfully! Please wait for verification.');
      fetchUserTasks(user.user_id);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Error completing task: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'expert': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #f59e0b',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Loading your tasks...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1e293b',
          margin: '0 0 8px 0'
        }}>
          My Tasks
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          margin: 0
        }}>
          Complete tasks to earn rewards and progress through sets
        </p>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }}>📋</div>
          <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Regular Tasks</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '8px' }}>⭐</div>
          <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Premium Tasks</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {premiumTasks.length}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', color: '#10b981', marginBottom: '8px' }}>💰</div>
          <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Current Set</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {user?.current_set || 1}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '24px',
        backgroundColor: 'white',
        borderRadius: '8px 8px 0 0',
        padding: '0 4px'
      }}>
        <button
          onClick={() => setActiveTab('regular')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'regular' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'regular' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'regular' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📋</span>
          Regular Tasks ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('premium')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'premium' ? '2px solid #f59e0b' : '2px solid transparent',
            color: activeTab === 'premium' ? '#f59e0b' : '#64748b',
            fontWeight: activeTab === 'premium' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⭐</span>
          Premium Tasks ({premiumTasks.length})
        </button>
      </div>

      {/* Regular Tasks Tab */}
      {activeTab === 'regular' && (
        <div>
          {tasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                No Regular Tasks
              </h3>
              <p style={{ color: '#64748b', fontSize: '16px' }}>
                You don't have any regular tasks assigned yet.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: 0
                      }}>
                        Set {task.set_number} - Task {task.task_number}
                      </h3>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: getStatusColor(task.status) + '20',
                        color: getStatusColor(task.status)
                      }}>
                        {task.status === 'assigned' && '🔵 Assigned'}
                        {task.status === 'in_progress' && '🟡 In Progress'}
                        {task.status === 'completed' && '🟢 Completed'}
                      </span>
                    </div>
                    
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: '0 0 12px 0'
                    }}>
                      {task.description}
                    </p>

                    {task.instructions && (
                      <p style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        margin: '0 0 8px 0',
                        fontStyle: 'italic'
                      }}>
                        💡 {task.instructions}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                      <span>Reward: <strong style={{ color: '#10b981' }}>{formatCurrency(task.reward_amount)}</strong></span>
                      <span>Penalty: <strong style={{ color: '#dc2626' }}>{formatCurrency(task.penalty_amount)}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {task.status === 'assigned' && (
                      <button
                        onClick={() => handleStartTask(task.id, false)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Start Task
                      </button>
                    )}

                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteTask(task.id, false)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Complete Task
                      </button>
                    )}

                    {task.status === 'completed' && (
                      <span style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        ✅ Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Premium Tasks Tab */}
      {activeTab === 'premium' && (
        <div>
          {premiumTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⭐</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                No Premium Tasks
              </h3>
              <p style={{ color: '#64748b', fontSize: '16px' }}>
                You don't have any premium tasks assigned yet. Premium tasks are assigned by administrators.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {premiumTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${getDifficultyColor(task.difficulty)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1e293b',
                          margin: 0
                        }}>
                          Set {task.set_number} - Task {task.task_number}
                        </h3>
                        
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          textTransform: 'capitalize'
                        }}>
                          {task.task_type}
                        </span>

                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: getDifficultyColor(task.difficulty) + '20',
                          color: getDifficultyColor(task.difficulty),
                          textTransform: 'capitalize'
                        }}>
                          {task.difficulty}
                        </span>

                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: getStatusColor(task.status) + '20',
                          color: getStatusColor(task.status)
                        }}>
                          {task.status === 'assigned' && '🔵 Assigned'}
                          {task.status === 'in_progress' && '🟡 In Progress'}
                          {task.status === 'completed' && '🟢 Completed'}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: '0 0 12px 0'
                      }}>
                        {task.description}
                      </p>

                      {task.instructions && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: '12px'
                        }}>
                          <p style={{
                            fontSize: '13px',
                            color: '#374151',
                            margin: '0 0 6px 0',
                            fontWeight: '500'
                          }}>
                            📝 Instructions:
                          </p>
                          <p style={{
                            fontSize: '13px',
                            color: '#64748b',
                            margin: 0
                          }}>
                            {task.instructions}
                          </p>
                        </div>
                      )}

                      {task.requirements && (
                        <div style={{
                          backgroundColor: '#fffbeb',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: '12px'
                        }}>
                          <p style={{
                            fontSize: '13px',
                            color: '#92400e',
                            margin: '0 0 6px 0',
                            fontWeight: '500'
                          }}>
                            ⚡ Requirements:
                          </p>
                          <p style={{
                            fontSize: '13px',
                            color: '#b45309',
                            margin: 0
                          }}>
                            {task.requirements}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b' }}>
                      <div>
                        <span>Penalty: </span>
                        <strong style={{ color: '#dc2626' }}>{formatCurrency(task.penalty_amount)}</strong>
                      </div>
                      <div>
                        <span>Pending: </span>
                        <strong style={{ color: '#f59e0b' }}>{formatCurrency(task.additional_pending)}</strong>
                      </div>
                      <div>
                        <span>Reward: </span>
                        <strong style={{ color: '#10b981' }}>{formatCurrency(task.reward_amount)}</strong>
                      </div>
                      {task.completion_time_limit && (
                        <div>
                          <span>Time Limit: </span>
                          <strong style={{ color: '#1e293b' }}>{task.completion_time_limit}h</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      {task.status === 'assigned' && (
                        <button
                          onClick={() => handleStartTask(task.id, true)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Start Premium Task
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteTask(task.id, true)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Complete Task
                        </button>
                      )}

                      {task.status === 'completed' && (
                        <span style={{
                          padding: '10px 20px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          ✅ Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {task.assigned_at && (
                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                      Assigned on: {new Date(task.assigned_at).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}