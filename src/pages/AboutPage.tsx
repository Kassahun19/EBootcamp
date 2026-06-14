import React from 'react';
import { Target, Eye, Compass, Award, ShieldAlert, CheckCircle, ChevronRight, UserCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-slate-50 text-slate-800 py-12 px-4 md:py-16" id="about-page">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Education Tailored For <span className="text-emerald-600">Enterprise Excellence</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Ezana Academy is Ethiopia’s premier educational ecosystem, specializing in conversational English structures, rigorous mathematics logics, and AI Full-Stack engineering.
          </p>
        </div>

        {/* Vision & Mission grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Our Precise Mission</h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              To democratize elite, industry-current knowledge. By blending local context, low-bandwidth video players, and local payments, we make high-tier education highly viable.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Our Future Vision</h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              We envision cultivating 50,000 highly competent software developers, fluent communications directors, and logical engineers ready to scale products in the global remote workspace.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Core Organizational Goals</h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Eliminate technical dependencies, encourage solid mathematical proofs, and structure scalable developer pathways using modern frameworks like Node.js, SQLite, and Gemini.
            </p>
          </div>
        </div>

        {/* Why Ezana Academy & Learning Methodology details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-8 border-t border-slate-200">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Structured Methodology</h2>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
              We believe structured repetition is superior to continuous watching. Every course on Ezana Academy utilizes a multi-layered verification system:
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: "Dynamic Modularization", desc: "Courses are split into logically sequential Modules and Lessons with embedded unlisted YouTube video playback IDs." },
                { title: "Active Assessment Quizzes", desc: "Test comprehension on logical logic queries or React states with interactive pass/fail check limits." },
                { title: "Practical Homework Assignments", desc: "Students submit source files directly in the student dashboard, reviewed and marked by senior lecturers." },
                { title: "Verifiable Certificates", desc: "Pass quizzes to receive formal graduation documentation, equipped with dynamic web QR indicators." }
              ].map((m, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs mt-0.5">{idx + 1}</span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs md:text-sm">{m.title}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Elite Instructor Highlights</h3>
            
            <div className="space-y-6">
              {[
                { name: "Dr. Demeke Assefa", title: "Senior Mathematics Lecturer & Software Architect", bio: "With 12+ years of university lecturing experience, Dr. Demeke teaches discrete mathematics structures and React state hook engines with high clarity.", image: "https://images.unsplash.com/photo-1544717302-2782549b5136?w=150" },
                { name: "Kassahun Mulatu", title: "Principal SaaS Engineer & Founder", bio: "Kassahun governs the operational workflow of computer science modules, full-stack endpoints, and manual transaction receipt approvals.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }
              ].map((inst, index) => (
                <div key={index} className="flex gap-4 items-start pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                  <img src={inst.image} alt={inst.name} className="w-14 h-14 rounded-full object-cover border border-emerald-500/20" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{inst.name}</h4>
                    <p className="text-slate-600 text-xs font-semibold">{inst.title}</p>
                    <p className="text-slate-500 text-xs leading-normal mt-1">{inst.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
