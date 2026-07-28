import React from 'react';
import { Button } from '@/components/ui/button';
// import { useGet } from '@/hooks/useGet'; // Ready for API integration

// Mock Data
const MOCK_USERS = [
  { id: 1, name: 'Alice Smith', email: 'alice.smith@example.com', phone: '+1 234 567 8900', role: 'Engineer' },
  { id: 2, name: 'Bob Jones', email: 'bob.jones@example.com', phone: '+1 234 567 8901', role: 'Tester' },
  { id: 3, name: 'Charlie Brown', email: 'charlie.brown@example.com', phone: '+1 234 567 8902', role: 'Engineer' },
  { id: 4, name: 'Diana Prince', email: 'diana.prince@example.com', phone: '+1 234 567 8903', role: 'Tester' },
];

const MOCK_ADMINS = [
  { id: 1, name: 'Eve Administrator', email: 'eve.admin@example.com', phone: '+1 234 567 8999', online: true },
  { id: 2, name: 'Frank System', email: 'frank.system@example.com', phone: '+1 234 567 8998', online: false },
];

const Dashboard = () => {
  // API Integration placeholder
  // const { data: users, loading: usersLoading } = useGet('/api/users');
  // const { data: admins, loading: adminsLoading } = useGet('/api/admins');

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8f9fa] min-h-screen relative text-[#191c1d]">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">Dashboard</h1>
        <p className="text-[#464555] mt-1">Overview and management of the system</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#edeeef] border-l-4 border-l-[#3525cd] flex items-start gap-4">
          <div className="bg-[#f3f4f5] p-3 rounded-lg text-[#3525cd]">
            <span className="material-symbols-outlined text-3xl">group</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#464555]">Total Users</h3>
            <p className="text-2xl font-bold font-['Plus_Jakarta_Sans'] mt-1">1,248</p>
            <p className="text-sm text-[#464555] mt-1">842 Engineers, 406 Testers</p>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#edeeef] border-l-4 border-l-[#006c49] flex items-start gap-4">
          <div className="bg-[#f3f4f5] p-3 rounded-lg text-[#006c49]">
            <span className="material-symbols-outlined text-3xl">rocket_launch</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#464555]">Active Projects</h3>
            <p className="text-2xl font-bold font-['Plus_Jakarta_Sans'] mt-1">32</p>
            <p className="text-sm text-[#464555] mt-1">+4 started this week</p>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#edeeef] border-l-4 border-l-[#684000] flex items-start gap-4">
          <div className="bg-[#f3f4f5] p-3 rounded-lg text-[#684000]">
            <span className="material-symbols-outlined text-3xl">assignment_late</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#464555]">Pending Tasks</h3>
            <p className="text-2xl font-bold font-['Plus_Jakarta_Sans'] mt-1">148</p>
            <p className="text-sm text-[#464555] mt-1">24 High Priority</p>
          </div>
        </div>
      </div>

      {/* Manage Users Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#edeeef] overflow-hidden">
        <div className="p-6 border-b border-[#edeeef] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">Manage Users</h2>
            <p className="text-sm text-[#464555] mt-1">Oversee system access for Engineers and Testers</p>
          </div>
          <Button className="bg-[#3525cd] hover:bg-[#2b1da8] text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add New User
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#464555] font-medium border-b border-[#edeeef]">
              <tr>
                <th className="px-6 py-4">USER</th>
                <th className="px-6 py-4">CONTACT INFO</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e0e0ff] text-[#3525cd] flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[#191c1d]">{user.name}</p>
                      <p className="text-[#464555] text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#464555]">{user.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'Engineer' 
                        ? 'bg-[#e0e0ff] text-[#3525cd]' 
                        : 'bg-[#e0f3eb] text-[#006c49]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-[#464555] hover:text-[#3525cd] hover:bg-[#f3f4f5] rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button className="p-2 text-[#464555] hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Administrators Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#edeeef] overflow-hidden">
        <div className="p-6 border-b border-[#edeeef] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">System Administrators</h2>
            <p className="text-sm text-[#464555] mt-1">Manage users with administrative privileges</p>
          </div>
          <Button variant="outline" className="border-[#edeeef] text-[#191c1d] hover:bg-[#f3f4f5]">
            Promote Admin
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#464555] font-medium border-b border-[#edeeef]">
              <tr>
                <th className="px-6 py-4">ADMINISTRATOR</th>
                <th className="px-6 py-4">EMAIL</th>
                <th className="px-6 py-4">PHONE</th>
                <th className="px-6 py-4 text-right">ACCESS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {MOCK_ADMINS.map((admin) => (
                <tr key={admin.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#f3f4f5] text-[#464555] flex items-center justify-center font-bold">
                        {admin.name.charAt(0)}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${admin.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    <div>
                      <p className="font-medium text-[#191c1d]">{admin.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#464555]">{admin.email}</td>
                  <td className="px-6 py-4 text-[#464555]">{admin.phone}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#3525cd] hover:underline font-medium text-sm">
                      Edit Credentials
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAB - Fixed bottom-right chat bubble */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#3525cd] text-white rounded-full shadow-lg hover:bg-[#2b1da8] hover:-translate-y-1 transition-all flex items-center justify-center z-50">
        <span className="material-symbols-outlined">chat</span>
      </button>
      
    </div>
  );
};

export default Dashboard;
