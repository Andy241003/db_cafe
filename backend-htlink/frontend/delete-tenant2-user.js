// Test script to delete a tenant 2 user via frontend API
// This should be run in the browser console when on the frontend

// First login as admin to get proper authentication
const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'username=admin%40travel.link360.vn&password=SuperSecretPass123'
    });
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('isAuthenticated', 'true');
    
    console.log('✅ Login successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Login failed:', error);
  }
};

// Get current user to determine tenant
const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:8000/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Code': 'premier_admin' // Try tenant 2 first
      }
    });
    
    const user = await response.json();
    console.log('Current user:', user);
    
    // Set tenant based on user's tenant_id
    const tenantCode = user.tenant_id === 1 ? 'demo' : 'premier_admin';
    localStorage.setItem('tenant_code', tenantCode);
    localStorage.setItem('tenant_id', user.tenant_id.toString());
    
    return user;
  } catch (error) {
    console.error('❌ Get user failed:', error);
  }
};

// List all users in current tenant
const listUsers = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const tenantCode = localStorage.getItem('tenant_code') || 'demo';
    
    const response = await fetch('http://localhost:8000/api/v1/users/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Code': tenantCode
      }
    });
    
    const users = await response.json();
    console.log(`📋 Users in tenant ${tenantCode}:`, users);
    return users;
  } catch (error) {
    console.error('❌ List users failed:', error);
  }
};

// Delete a specific user
const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem('access_token');
    const tenantCode = localStorage.getItem('tenant_code') || 'demo';
    
    const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Code': tenantCode
      }
    });
    
    if (response.ok) {
      console.log(`✅ User ${userId} deleted successfully!`);
    } else {
      const error = await response.json();
      console.error('❌ Delete failed:', error);
    }
  } catch (error) {
    console.error('❌ Delete user failed:', error);
  }
};

// Main function to delete a tenant 2 user
const deleteTenant2User = async () => {
  console.log('🚀 Starting delete tenant 2 user process...');
  
  // Step 1: Login
  await testLogin();
  
  // Step 2: Try tenant 2 first
  localStorage.setItem('tenant_code', 'premier_admin');
  localStorage.setItem('tenant_id', '2');
  
  // Step 3: List users in tenant 2
  const users = await listUsers();
  
  if (users && users.length > 0) {
    // Find a non-owner user to delete
    const nonOwnerUser = users.find(user => user.role !== 'OWNER');
    
    if (nonOwnerUser) {
      console.log(`🎯 Found non-owner user to delete:`, nonOwnerUser);
      
      // Confirm deletion
      if (confirm(`Delete user: ${nonOwnerUser.full_name} (${nonOwnerUser.email})?`)) {
        await deleteUser(nonOwnerUser.id);
        
        // List users again to confirm deletion
        console.log('📋 Users after deletion:');
        await listUsers();
      }
    } else {
      console.log('⚠️ No non-owner users found in tenant 2');
    }
  } else {
    console.log('⚠️ No users found in tenant 2');
  }
};

// Export the main function
console.log('🔧 Delete Tenant 2 User Script loaded!');
console.log('Run: deleteTenant2User() to start the process');

// Auto-run if you want
// deleteTenant2User();