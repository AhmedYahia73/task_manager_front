import React, { useState, useRef } from 'react';
import { useGet } from '@/hooks/useGet';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/lib/axios';

const Apply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const { data: jobsData } = useGet('/api/public/careers/jobs');
  const { data: citiesData } = useGet('/api/public/careers/cities');
  const { data: qualificationsData } = useGet('/api/public/careers/qualifications');

  const jobs = jobsData?.jobs || [];
  const cities = citiesData?.cities || [];
  const qualifications = qualificationsData?.qualifications || [];

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    birthdate: '',
    marital_status: '',
    university: '',
    college: '',
    graduate_date: '',
    qualification_id: '',
    current_job: '',
    expected_salary: '',
    experiences: '',
    courses: '',
    city_id: '',
    job_id: initialJobId,
    link: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload your CV');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      data.append('upload_cv', file);

      const response = await apiClient.post('/api/public/careers/apply', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success || response.status === 201) {
        toast.success('Application submitted successfully!');
        navigate('/careers');
      } else {
        toast.error(response.data?.message || 'Error submitting application');
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fcf8f9] text-[#1b1b1c] min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#ddc1b2] shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-4 md:px-10 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/careers')}>
            <img alt="WegoStation Logo" className="h-10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdjcAj8kC_uFUk46qIheNwJ_pPwNhFxelwsGbOA30ciF5D5Ap3d5IUk9VgVgyD-lmVEOFhZ0QR-w2rgbmxUUwTcYIh6ApXeeO8EQH-o5kX68LXRJ6ClKq4DwT1wjmC5PRF-MGKAYPagoMABZvc9dirRHQQpDmtxOHe48Lj2oRv0ZlfY-wWJhkKYm05WFvAnIVNRQn0-wHhWnqu-r9OgDWuRsIST_VzkdQKY7C40hCqp9mq13cubWsJYwptsrYaybpGF20"/>
            <span className="text-2xl font-bold text-[#1b1b1c]">WegoStation</span>
          </div>
        </div>
      </header>

      <main className="flex-grow py-12 px-4 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-[#1b1b1c] mb-4">Join Our Team</h1>
            <p className="text-lg text-[#564337] max-w-2xl mx-auto">Fill out the application form below to apply for a position at WegoStation. We look forward to reviewing your profile.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Info */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 md:p-8 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-[#1b1b1c] mb-6 pb-2 border-b border-[#E0E0E0] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e87722]">person</span>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Full Name (الاسم الكامل) *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Phone Number (رقم الهاتف) *</label>
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="tel" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Address (العنوان) *</label>
                  <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Date of Birth (تاريخ الميلاد)</label>
                  <input name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="date" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Marital Status (الحالة الاجتماعية) *</label>
                  <select required name="marital_status" value={formData.marital_status} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all appearance-none">
                    <option value="" disabled>Select status</option>
                    <option value="single">Single (أعزب)</option>
                    <option value="married">Married (متزوج)</option>
                    <option value="separated">Separated (منفصل)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 md:p-8 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-[#1b1b1c] mb-6 pb-2 border-b border-[#E0E0E0] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e87722]">school</span>
                Education
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">University (الجامعة)</label>
                  <input name="university" value={formData.university} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">College/Faculty (الكلية)</label>
                  <input name="college" value={formData.college} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Graduation Date (تاريخ التخرج)</label>
                  <input name="graduate_date" value={formData.graduate_date} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="date" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Qualification (المؤهل) *</label>
                  <select required name="qualification_id" value={formData.qualification_id} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all appearance-none">
                    <option value="" disabled>Select Qualification</option>
                    {qualifications.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Background */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 md:p-8 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-[#1b1b1c] mb-6 pb-2 border-b border-[#E0E0E0] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e87722]">work</span>
                Professional Background
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#564337] mb-2">Current Job Title (الوظيفة الحالية)</label>
                    <input name="current_job" value={formData.current_job} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="text" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#564337] mb-2">Expected Salary EGP (الراتب المتوقع)</label>
                    <input name="expected_salary" value={formData.expected_salary} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="number" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Previous Experiences (الخبرات السابقة)</label>
                  <textarea name="experiences" value={formData.experiences} onChange={handleInputChange} className="w-full bg-white border border-[#D1D1D1] rounded-lg p-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all resize-y min-h-[120px]"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Training Courses (الدورات التدريبية)</label>
                  <input name="courses" value={formData.courses} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="text" />
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 md:p-8 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-[#1b1b1c] mb-6 pb-2 border-b border-[#E0E0E0] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e87722]">post_add</span>
                Application Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Preferred City (المدينة) *</label>
                  <select required name="city_id" value={formData.city_id} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all appearance-none">
                    <option value="" disabled>Select City</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Applying For (الوظيفة المتقدم لها) *</label>
                  <select required name="job_id" value={formData.job_id} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all appearance-none">
                    <option value="" disabled>Select Job</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Portfolio/LinkedIn Link (رابط الأعمال)</label>
                  <input name="link" value={formData.link} onChange={handleInputChange} className="w-full h-10 bg-white border border-[#D1D1D1] rounded-lg px-4 text-base focus:border-[#e87722] focus:ring-1 focus:ring-[#e87722] outline-none transition-all" type="url" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#564337] mb-2">Upload CV (رفع السيرة الذاتية) *</label>
                  <div className="relative w-full h-10 bg-white border border-[#D1D1D1] border-dashed rounded-lg flex items-center justify-center hover:border-[#e87722] transition-all cursor-pointer">
                    <input required accept=".pdf,.doc,.docx" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" type="file" />
                    <div className="flex items-center gap-2 text-[#5e5e60] pointer-events-none">
                      <span className="material-symbols-outlined">upload_file</span>
                      <span className="text-sm font-semibold">{file ? file.name : 'Choose file'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#5e5e60] mt-1 text-right">PDF, DOC, DOCX up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button disabled={loading} className="bg-[#E87722] text-white font-semibold px-8 h-12 rounded-lg hover:bg-[#994700] hover:shadow-lg transition-all flex items-center justify-center gap-2 min-w-[200px]" type="submit">
                {loading ? 'Submitting...' : 'Submit Application'}
                {!loading && <span className="material-symbols-outlined">send</span>}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-[#eae7e8] border-t border-[#ddc1b2] w-full mt-auto">
        <div className="w-full py-8 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-6">
          <div className="text-sm font-bold text-[#994700]">
            © 2024 WegoStation. All rights reserved.
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <a className="text-[#564337] hover:text-[#994700] underline transition-all" href="#">Privacy Policy</a>
            <a className="text-[#564337] hover:text-[#994700] underline transition-all" href="#">Terms of Service</a>
            <a className="text-[#564337] hover:text-[#994700] underline transition-all" href="#">Contact Us</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Apply;
