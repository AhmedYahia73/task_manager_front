import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const projectsData = [
  {
    id: 1,
    name: 'Quantum Pay Gateway',
    description: 'Integrate the new quantum-safe cryptographic payment gateway for international transactions.',
    progress: 78,
    color: 'border-l-[#3525cd]',
    progressColor: 'bg-[#3525cd]',
    docLink: 'https://docs.quantumpay.local',
    testers: ['A', 'B', 'C'],
    extraTesters: 2,
  },
  {
    id: 2,
    name: 'EcoStream Analytics',
    description: 'Real-time environmental data stream processing and analytics dashboard for enterprise clients.',
    progress: 100,
    color: 'border-l-[#006c49]',
    progressColor: 'bg-[#006c49]',
    docLink: 'https://docs.ecostream.local',
    testers: ['D', 'E'],
    extraTesters: 0,
  },
  {
    id: 3,
    name: 'Project Hydra UI',
    description: 'A complete overhaul of the internal administrative interfaces using the new design system.',
    progress: 42,
    color: 'border-l-[#684000]',
    progressColor: 'bg-[#684000]',
    docLink: 'https://docs.hydra.local',
    testers: ['F', 'G', 'H', 'I'],
    extraTesters: 5,
  }
];

const Projects = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState(projectsData);

  const handleAddProject = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    toast.success('Project created successfully!');
  };

  return (
    <div className="admin-projects p-4 md:p-8 min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[#3525cd] mb-2">Projects</h1>
          <p className="text-[#464555] font-['Inter']">Manage your enterprise workflow and testing cycles.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>
          Add Project
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {projects.map((project) => (
          <div key={project.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative border-l-4 ${project.color}`}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-[#3525cd] transition-colors">
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
            <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] mb-2 pr-8">{project.name}</h3>
            <p className="text-[#464555] font-['Inter'] text-sm mb-6 line-clamp-2 h-10">{project.description}</p>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-[#f3f4f5] rounded-full h-2">
                <div className={`${project.progressColor} h-2 rounded-full`} style={{ width: `${project.progress}%` }}></div>
              </div>
            </div>

            <a href={project.docLink} target="_blank" rel="noreferrer" className="text-sm text-[#3525cd] flex items-center gap-1 mb-6 hover:underline w-fit">
              <span className="material-symbols-outlined text-sm">link</span>
              Documentation
            </a>

            <div className="flex items-center mb-6">
              <div className="flex -space-x-3">
                {project.testers.map((t, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#edeeef] border-2 border-white flex items-center justify-center text-xs font-bold text-[#464555]">
                    {t}
                  </div>
                ))}
                {project.extraTesters > 0 && (
                  <div className="w-8 h-8 rounded-full bg-[#f3f4f5] border-2 border-white flex items-center justify-center text-xs font-bold text-[#464555]">
                    +{project.extraTesters}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <Button onClick={() => navigate(`/admin/projects/${project.id}`)} variant="outline" className="flex-1 border-[#3525cd] text-[#3525cd] hover:bg-[#3525cd]/5">
                View Details
              </Button>
              <Button variant="ghost" className="text-[#ba1a1a] hover:bg-[#ba1a1a]/10 hover:text-[#ba1a1a] px-3">
                <span className="material-symbols-outlined">delete</span>
              </Button>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-[#464555] hover:text-[#3525cd] hover:border-[#3525cd] hover:bg-[#3525cd]/5 transition-all min-h-[320px]"
        >
          <span className="material-symbols-outlined text-4xl mb-2">add_circle</span>
          <span className="font-semibold font-['Plus_Jakarta_Sans']">Add New Project</span>
        </button>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Active Projects', value: '12', icon: 'monitoring' },
          { label: 'Total Testers', value: '48', icon: 'group' },
          { label: 'Completed This Month', value: '05', icon: 'task_alt' },
          { label: 'Avg. Completion Rate', value: '64%', icon: 'trending_up' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f3f4f5] flex items-center justify-center text-[#3525cd] shrink-0">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold font-['Plus_Jakarta_Sans']">{stat.value}</p>
              <p className="text-xs text-[#464555] font-['Inter'] whitespace-nowrap">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans']">Create New Project</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[#191c1d] mb-1">Project Name</label>
                <Input placeholder="e.g. Quantum Pay Gateway" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#191c1d] mb-1">Description</label>
                <textarea 
                  className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter project description"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#191c1d] mb-1">Documentation Link</label>
                <Input type="url" placeholder="https://..." />
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white">
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
