import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
  const [activeTab, setActiveTab] = useState('All Tasks');
  
  const tabs = ['All Tasks', 'Pending', 'In Progress', 'Done', 'Edit', 'Approve'];
  
  const tasks = [
    {
      id: 1,
      title: 'API Endpoint Documentation',
      description: 'Update Swagger docs for the new v2 endpoints',
      testerNote: 'Needs review from QA team',
      assigned: { name: 'Sarah Chen', role: 'Backend Lead' },
      delivery: 'Oct 24 2023',
      urgency: { text: '2 Days Left', color: 'text-error text-[#ba1a1a]' },
      status: 'In Progress',
      color: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-700',
      dot: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Security Audit Report',
      description: 'Monthly vulnerability scan and remediation plan',
      testerNote: null,
      assigned: { name: 'Marcus Thorne', role: 'Security Ops' },
      delivery: 'Oct 28 2023',
      urgency: { text: 'Scheduled', color: 'text-[#464555]' },
      status: 'Pending',
      color: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-700',
      dot: 'bg-amber-500'
    },
    {
      id: 3,
      title: 'UI Kit Version 2.0 Launch',
      description: 'Final design system components and tokens',
      testerNote: null,
      assigned: { name: 'Alex Rivera', role: 'Design Lead' },
      delivery: 'Oct 20 2023',
      urgency: { text: 'Past Due', color: 'text-[#006c49]' }, // Secondary color
      status: 'Approve',
      color: 'bg-purple-500',
      badge: 'bg-purple-100 text-purple-700',
      dot: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Database Migration Script',
      description: 'PostgreSQL schema updates for user auth',
      testerNote: null,
      assigned: { name: 'Liam Vance', role: 'Data Engineer' },
      delivery: 'Oct 18 2023',
      urgency: null,
      status: 'Done',
      color: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700',
      dot: 'bg-emerald-500'
    },
    {
      id: 5,
      title: 'Marketing Copy Review',
      description: 'Landing page messaging for Q4 campaign',
      testerNote: 'Awaiting stakeholder feedback',
      assigned: { name: 'Elena Rossi', role: 'Content Writer' },
      delivery: 'Oct 31 2023',
      urgency: null,
      status: 'Edit',
      color: 'bg-orange-500',
      badge: 'bg-orange-100 text-orange-700',
      dot: 'bg-orange-500'
    }
  ];

  return (
    <div className="admin-tasks-page min-h-screen bg-[#f8f9fa] p-6 font-inter text-[#191c1d]">
      {/* Header Section */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 text-sm text-[#464555]">
            Projects <span className="mx-2">/</span> Q4 Infrastructure Overhaul
          </nav>
          <h1 className="font-plus-jakarta text-3xl font-bold tracking-tight text-[#191c1d]">Task Management</h1>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-[#3525cd] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-opacity-90">
          <span className="material-symbols-outlined text-[20px]">add_task</span>
          Add Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-[#edeeef]">
        <ul className="flex flex-wrap -mb-px">
          {tabs.map((tab) => (
            <li key={tab} className="mr-6">
              <button
                onClick={() => setActiveTab(tab)}
                className={`inline-block border-b-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-[#3525cd] text-[#3525cd]'
                    : 'border-transparent text-[#464555] hover:border-[#edeeef] hover:text-[#191c1d]'
                }`}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Task Table */}
      <div className="mb-6 overflow-hidden rounded-xl border border-[#edeeef] bg-white/60 shadow-sm backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f3f4f5] text-xs uppercase text-[#464555]">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Task Details</th>
                <th scope="col" className="px-6 py-4 font-semibold">Assigned</th>
                <th scope="col" className="px-6 py-4 font-semibold">Delivery</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {tasks.map((task) => (
                <tr 
                  key={task.id} 
                  className={`group bg-white hover:bg-[#f3f4f5] transition-colors ${task.status === 'Done' ? 'opacity-60' : ''}`}
                >
                  <td className="relative px-6 py-4">
                    <div className={`absolute left-0 top-0 h-full w-[3px] ${task.color}`}></div>
                    <div className="flex flex-col">
                      <span className={`font-plus-jakarta text-base font-semibold text-[#191c1d] ${task.status === 'Done' ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                      <span className="mt-1 text-sm text-[#464555]">{task.description}</span>
                      {task.testerNote && (
                        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-[#edeeef] px-2 py-0.5 text-xs text-[#464555]">
                          <span className="material-symbols-outlined text-[14px]">speaker_notes</span>
                          {task.testerNote}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edeeef] text-[#464555] font-medium">
                        {task.assigned.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#191c1d]">{task.assigned.name}</span>
                        <span className="text-xs text-[#464555]">{task.assigned.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#191c1d]">{task.delivery}</span>
                      {task.urgency && (
                        <span className={`text-xs font-medium mt-0.5 ${task.urgency.color}`}>
                          {task.urgency.text}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${task.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${task.dot}`}></span>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="flex h-8 w-8 items-center justify-center rounded text-[#464555] hover:bg-[#edeeef] hover:text-[#3525cd]">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded text-[#464555] hover:bg-[#edeeef] hover:text-[#3525cd]">
                        <span className="material-symbols-outlined text-[18px]">sync</span>
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded text-[#464555] hover:bg-[#ba1a1a] hover:text-white">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#edeeef] bg-white px-6 py-4">
          <span className="text-sm text-[#464555]">Showing 5 of 24 tasks</span>
          <div className="flex gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded border border-[#edeeef] text-[#464555] hover:bg-[#edeeef]">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded bg-[#3525cd] text-white">1</button>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-[#edeeef] text-[#191c1d] hover:bg-[#edeeef]">2</button>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-[#edeeef] text-[#191c1d] hover:bg-[#edeeef]">3</button>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-[#edeeef] text-[#464555] hover:bg-[#edeeef]">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3525cd]/10 text-[#3525cd]">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">Pending Tasks</p>
            <p className="text-2xl font-bold text-[#191c1d]">12</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="material-symbols-outlined">clock_loader_40</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">In Progress</p>
            <p className="text-2xl font-bold text-[#191c1d]">8</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">Completed</p>
            <p className="text-2xl font-bold text-[#191c1d]">45</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <span className="material-symbols-outlined">error</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">Needs Revision</p>
            <p className="text-2xl font-bold text-[#191c1d]">4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
