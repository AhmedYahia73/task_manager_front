import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';

const Careers = () => {
  const canvasRef = useRef(null);
  const { data, loading } = useGet('/api/public/careers/jobs');
  const jobs = data?.jobs || [];
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;
    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;
    float wave = sin(uv.x * 3.0 + u_time * 0.5) * 0.02;
    float wave2 = cos(uv.y * 2.0 - u_time * 0.3) * 0.01;
    vec3 color = vec3(0.98, 0.98, 0.99);
    float dist = distance(uv, vec2(0.5, 0.5));
    vec3 orange = vec3(0.91, 0.47, 0.13);
    color = mix(color, orange, (1.0 - dist) * 0.05 + wave + wave2);
    gl_FragColor = vec4(color, 1.0);
}`;
    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    
    let animationId;
    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="bg-[#fcf8f9] text-[#1b1b1c] font-sans antialiased overflow-x-hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#fcf8f9]/90 backdrop-blur-md sticky top-0 z-50 w-full border-b border-[#ddc1b2] shadow-sm">
        <div className="flex justify-between items-center w-full px-4 md:px-10 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#eae7e8] overflow-hidden border border-[#ddc1b2]">
              <span className="material-symbols-outlined text-[#994700]">domain</span>
            </div>
            <h1 className="text-2xl font-bold text-[#994700] tracking-tight">WegoStation</h1>
          </div>
          <button onClick={() => document.getElementById('open-roles').scrollIntoView({ behavior: 'smooth' })} className="bg-[#e87722] text-[#4f2200] font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
            Open Positions
          </button>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 md:px-10 py-20 overflow-hidden">
          <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
            <canvas ref={canvasRef} className="block w-full h-full"></canvas>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
            <img alt="WegoStation Logo" className="h-24 md:h-32 mb-8 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKaopi0pxG06IiW-SjMZ01I3cBPJ70x6Hjl0XqOa-Di6A0YvL_RhJq6mbfPpbZ0v23roO0hALT2t0JKFGv4BTEE8uM-7a25IOFCLhzK5R9p-qwSebam8M8qR18DEiwH7PSrxypwx0RDamSMwzC29K9lHF6beWCLIqeq7ex-W5Cgwmh7Up7nRBPh0PNkGyczydg1-9ZjAJNKkL2dGvMhbLPYBHIE8Glms9dqoJxFMoW24ZYol73sZ6PpwvP1aA0O9w35aY"/>
            <h2 className="text-3xl md:text-5xl font-bold text-[#1b1b1c] mb-4 max-w-3xl leading-tight">
              Join the Innovation at WegoStation
            </h2>
            <p className="text-lg text-[#564337] max-w-2xl mb-10">
              We're looking for visionary minds to shape the future of technology and infrastructure.
            </p>
            <button onClick={() => document.getElementById('open-roles').scrollIntoView({ behavior: 'smooth' })} className="bg-[#e87722] text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-0.5">
              Explore Opportunities
            </button>
          </div>
        </section>

        {/* Roles */}
        <section id="open-roles" className="py-20 bg-white px-4 md:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-[#1b1b1c] mb-2">Open Roles</h3>
              <p className="text-base text-[#564337]">Find where you fit in our ecosystem of innovation.</p>
            </div>
            {loading ? (
              <div className="text-center py-10">Loading positions...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job, index) => (
                  <div key={job.id} className="bg-white rounded-lg border border-[#E0E0E0] p-6 hover:shadow-md transition-shadow duration-300 flex flex-col h-full" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-[#eae7e8] text-[#5d5f5f] text-xs font-semibold rounded-full mb-3">Hiring</span>
                      <h4 className="text-xl font-bold text-[#1b1b1c] mb-1">{job.name}</h4>
                      <div className="flex items-center text-[#564337] text-xs font-semibold gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        <span>Multiple Locations</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-[#eae7e8]">
                      <button onClick={() => navigate(`/careers/apply?jobId=${job.id}`)} className="w-full bg-white border border-[#5e5e60] text-[#5e5e60] font-semibold py-2 rounded hover:bg-[#f6f3f4] transition-colors">
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Culture */}
        <section className="py-20 bg-[#fcf8f9] px-4 md:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-2xl font-bold text-[#1b1b1c] mb-2">Our Values</h3>
              <p className="text-base text-[#564337]">The principles that drive our innovation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#e87722]/10 flex items-center justify-center mb-6 text-[#e87722]">
                  <span className="material-symbols-outlined text-[32px]">lightbulb</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1b1b1c] mb-3">Innovation</h4>
                <p className="text-base text-[#564337]">We constantly push boundaries and explore new technologies to solve complex problems.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#e87722]/10 flex items-center justify-center mb-6 text-[#e87722]">
                  <span className="material-symbols-outlined text-[32px]">group</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1b1b1c] mb-3">Collaboration</h4>
                <p className="text-base text-[#564337]">Great ideas are born from diverse minds working together in a supportive environment.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#e87722]/10 flex items-center justify-center mb-6 text-[#e87722]">
                  <span className="material-symbols-outlined text-[32px]">verified</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1b1b1c] mb-3">Excellence</h4>
                <p className="text-base text-[#564337]">We are committed to delivering the highest quality in everything we build and design.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#e5e2e3] border-t border-[#ddc1b2] w-full mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-10 py-8 max-w-7xl mx-auto gap-6 md:gap-0">
          <div className="text-xl font-bold text-[#994700]">WegoStation</div>
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold">
            <Link to="/careers" className="text-[#994700] underline opacity-80 hover:opacity-100">Careers</Link>
            <a className="text-[#5e5e60] hover:text-[#994700] transition-colors hover:underline opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="text-[#5e5e60] hover:text-[#994700] transition-colors hover:underline opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          </nav>
          <div className="text-sm text-[#1b1b1c] text-center md:text-right">
            © 2024 WegoStation. Empowering Innovation.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Careers;
