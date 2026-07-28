import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Mock Data
const groups = [
  {
    id: 'engineering',
    name: 'Engineering Team',
    icon: 'engineering',
    description: 'Core backend and frontend development team.',
    memberCount: 8,
    members: [
      { id: 1, name: 'Alex Doe', avatar: 'https://i.pravatar.cc/150?u=1' },
      { id: 2, name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=2' },
      { id: 3, name: 'Bob Johnson', avatar: 'https://i.pravatar.cc/150?u=3' },
    ],
    lead: 'Alex Doe',
    capacity: 85,
    status: 'Priority 1'
  },
  {
    id: 'ux',
    name: 'UX/UI Design',
    icon: 'palette',
    description: 'User experience and interface design.',
    memberCount: 4,
    members: [
      { id: 4, name: 'Alice Ray', avatar: 'https://i.pravatar.cc/150?u=4' },
      { id: 5, name: 'Tom Hardy', avatar: 'https://i.pravatar.cc/150?u=5' },
    ],
    lead: 'Alice Ray',
    capacity: 60,
    status: 'Priority 2'
  },
  {
    id: 'gtm',
    name: 'Go-To-Market',
    icon: 'campaign',
    description: 'Marketing and sales alignment team.',
    memberCount: 6,
    members: [
      { id: 6, name: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?u=6' },
    ],
    lead: 'Sarah Connor',
    capacity: 90,
    status: 'Priority 1'
  }
];

const assignedUsers = [
  { id: 1, name: 'Alex Doe', email: 'alex@example.com', role: 'Lead Developer', availability: 85, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Senior Developer', availability: 60, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Frontend Developer', availability: 100, avatar: 'https://i.pravatar.cc/150?u=3' },
];

const ProjectDetails = () => {
  const { id } = useParams();
  const [selectedGroup, setSelectedGroup] = useState('engineering');

  const activeGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <div className="admin-project-details p-6 bg-[#f8f9fa] min-h-screen font-inter text-[#191c1d]">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-[#464555] mb-6">
        <Link to="/admin/projects" className="hover:underline">Projects</Link>
        <span className="material-symbols-outlined mx-2 text-[16px]">chevron_right</span>
        <span className="font-semibold text-[#191c1d]">Project Phoenix - Global Ops</span>
      </div>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-jakarta text-[#191c1d] mb-2">Project Phoenix</h1>
          <div className="flex items-center text-sm text-[#464555]">
            <span>Created Oct 24, 2023</span>
            <span className="mx-2">•</span>
            <a href="#" className="text-[#3525cd] hover:underline flex items-center">
              <span className="material-symbols-outlined text-[16px] mr-1">description</span>
              Documentation
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#464555] text-[#191c1d]">
            <span className="material-symbols-outlined mr-2">edit</span>
            Edit Project
          </Button>
          <Button className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white">
            <span className="material-symbols-outlined mr-2">add</span>
            Create Group
          </Button>
        </div>
      </div>

      {/* Main Layout - 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (4 cols) - Groups Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#edeeef] shadow-sm">
            <h2 className="text-xl font-bold font-jakarta text-[#191c1d]">Groups</h2>
            <span className="bg-[#f3f4f5] text-[#464555] px-2 py-1 rounded text-xs font-semibold">4 Active</span>
          </div>

          <div className="flex flex-col gap-3">
            {groups.map(group => {
              const isActive = selectedGroup === group.id;
              return (
                <div 
                  key={group.id} 
                  onClick={() => setSelectedGroup(group.id)}
                  className={`cursor-pointer p-5 rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'border-l-4 border-l-[#3525cd] border-y-[#edeeef] border-r-[#edeeef] bg-white shadow-md' 
                      : 'border-[#edeeef] bg-[#f8f9fa] hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#3525cd]/10 text-[#3525cd]' : 'bg-[#edeeef] text-[#464555]'}`}>
                      <span className="material-symbols-outlined">{group.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold font-jakarta mb-1 truncate ${isActive ? 'text-[#3525cd]' : 'text-[#191c1d]'}`}>{group.name}</h3>
                      <p className="text-sm text-[#464555] line-clamp-1 mb-3">{group.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 3).map((member, idx) => (
                            <img key={idx} src={member.avatar} alt="member" className="w-6 h-6 rounded-full border border-white" />
                          ))}
                          {group.memberCount > 3 && (
                            <div className="w-6 h-6 rounded-full bg-[#f3f4f5] flex items-center justify-center text-[10px] font-medium border border-white">
                              +{group.memberCount - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-[#464555]">{group.memberCount} members</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (8 cols) - Group Detail View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#edeeef] shadow-sm overflow-hidden">
            {/* Top banner with gradient */}
            <div className="h-24 bg-gradient-to-r from-[#3525cd]/20 to-[#3525cd]/5 w-full"></div>
            
            <div className="px-6 pb-6 -mt-10 relative">
              <div className="flex justify-between items-end mb-6">
                <div className="flex items-end gap-4">
                  <div className="w-20 h-20 bg-[#3525cd] rounded-xl flex items-center justify-center text-white border-4 border-white shadow-sm">
                    <span className="material-symbols-outlined text-4xl">{activeGroupData.icon}</span>
                  </div>
                  <div className="mb-1">
                    <h2 className="text-2xl font-bold font-jakarta text-[#191c1d]">{activeGroupData.name}</h2>
                    <p className="text-[#464555]">Strategic operations and planning</p>
                  </div>
                </div>
                <Button className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white">
                  <span className="material-symbols-outlined mr-2">person_add</span>
                  Assign Users
                </Button>
              </div>

              {/* Description text & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 text-[#464555] text-sm leading-relaxed">
                  <p className="mb-2">This group is responsible for the core infrastructure and product development. Members will be working directly on critical paths for the upcoming Q3 deliverables.</p>
                  <p>Regular syncs are scheduled every Tuesday and Thursday.</p>
                </div>
                <div className="md:col-span-1 bg-[#f8f9fa] rounded-lg p-4 border border-[#edeeef] space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#464555]">Lead:</span>
                    <span className="font-semibold text-[#191c1d]">{activeGroupData.lead}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#464555]">Capacity:</span>
                    <span className="font-semibold text-[#191c1d]">{activeGroupData.capacity}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#464555]">Status:</span>
                    <span className="bg-[#3525cd]/10 text-[#3525cd] px-2 py-0.5 rounded text-xs font-semibold">{activeGroupData.status}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Users Table */}
              <div>
                <h3 className="text-lg font-bold font-jakarta text-[#191c1d] mb-4">Assigned Users</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#edeeef] text-xs font-semibold text-[#464555] uppercase tracking-wider">
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium w-32">Availability</th>
                        <th className="pb-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {assignedUsers.map(user => (
                        <tr key={user.id} className="border-b border-[#f3f4f5] hover:bg-[#f8f9fa] group transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                              <div>
                                <div className="font-semibold text-[#191c1d]">{user.name}</div>
                                <div className="text-xs text-[#464555]">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-[#191c1d]">{user.role}</td>
                          <td className="py-3">
                            <div className="w-full bg-[#edeeef] rounded-full h-2 mb-1">
                              <div className="bg-[#006c49] h-2 rounded-full" style={{ width: `${user.availability}%` }}></div>
                            </div>
                            <span className="text-xs text-[#464555]">{user.availability}% Allocation</span>
                          </td>
                          <td className="py-3 text-right">
                            <button className="text-[#464555] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-[20px]">person_remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#edeeef] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#3525cd]/10 text-[#3525cd] flex items-center justify-center">
                  <span className="material-symbols-outlined">add_task</span>
                </div>
                <div>
                  <h3 className="font-bold font-jakarta text-[#191c1d]">Group Tasks</h3>
                  <p className="text-sm text-[#464555]">12 items pending review</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-auto border-[#edeeef] hover:bg-[#f8f9fa]">
                Manage Tasks
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-[#edeeef] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#006c49]/10 text-[#006c49] flex items-center justify-center">
                  <span className="material-symbols-outlined">insights</span>
                </div>
                <div>
                  <h3 className="font-bold font-jakarta text-[#191c1d]">Efficiency</h3>
                  <p className="text-sm text-[#006c49] font-medium">+12% vs last week</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-auto border-[#edeeef] hover:bg-[#f8f9fa]">
                View Analytics
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetails;
