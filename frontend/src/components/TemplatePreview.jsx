import React from 'react';
import { GripVertical, Mail, Phone, MapPin, Linkedin, Github, Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import EditableText from './EditableText';

const TemplatePreview = ({ 
  resumeData, 
  isLayoutEditMode, 
  onDragEnd, 
  onInlineEdit,
  onAddSectionItem,
  onDeleteSectionItem
}) => {
  const primaryColor = resumeData.themeColor || '#2563eb';
  const isOnePage = resumeData.pageMode === 'one-page';
  const showIcons = resumeData.showIcons;
  const sectionOrder = resumeData.sectionOrder || ['summary', 'experience', 'projects', 'education', 'skills', 'languages', 'achievements', 'activities'];

  // Layout Engine variables
  const sectionSpacing = isOnePage ? 'mb-4' : 'mb-6';
  const itemSpacing = isOnePage ? 'mb-2' : 'mb-4';
  const lineHeight = isOnePage ? '1.4' : '1.6';
  
  // Auto Compression Engine
  const contentString = JSON.stringify(resumeData);
  let baseFontSize = isOnePage ? '13px' : '15px';
  if (isOnePage && contentString.length > 3000) baseFontSize = '12px';
  if (isOnePage && contentString.length > 4000) baseFontSize = '11px';

  const sectionHeaderStyle = {
    fontSize: isOnePage ? '14px' : '18px',
    fontWeight: '700',
    color: primaryColor,
    borderBottom: `2px solid ${primaryColor}`,
    paddingBottom: '2px',
    marginBottom: isOnePage ? '6px' : '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const renderIcon = (IconComponent) => {
    return showIcons ? <IconComponent size={parseInt(baseFontSize)} className="mr-1 inline-block" style={{ color: primaryColor }} /> : null;
  };

  // Section Renderers Dictionary
  const sectionRenderers = {
    summary: () => {
      if (!resumeData?.personalInfo?.summary) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Professional Summary</h2>
          <div className="text-gray-700 text-justify" dangerouslySetInnerHTML={{ __html: resumeData.personalInfo.summary }} />
        </>
      );
    },
    experience: () => {
      if (!resumeData?.experience || resumeData.experience.length === 0 || !resumeData.experience[0]?.company) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Experience</h2>
          <div className="space-y-4">
            {resumeData.experience.map((exp, i) => (
              <div key={i} className="group relative">
                {isLayoutEditMode && (
                  <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDeleteSectionItem('experience', i)} className="p-1.5 text-gray-400 hover:text-red-500 bg-white shadow rounded-lg border border-gray-100"><Trash2 size={14} /></button>
                    {i === resumeData.experience.length - 1 && (
                      <button onClick={() => onAddSectionItem('experience', {company:'', position:'', startDate:'', endDate:'', description:''})} className="p-1.5 text-gray-400 hover:text-blue-500 bg-white shadow rounded-lg border border-gray-100 mt-1"><Plus size={14} /></button>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <EditableText tagName="h3" className="font-bold text-gray-900" isEditMode={isLayoutEditMode} value={exp.company} onSave={(val) => onInlineEdit(`experience[${i}].company`, val)} placeholder="Company" />
                    <div className="text-gray-700 font-semibold italic">
                      <EditableText tagName="span" isEditMode={isLayoutEditMode} value={exp.position} onSave={(val) => onInlineEdit(`experience[${i}].position`, val)} placeholder="Job Title" />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-gray-600">
                      <EditableText tagName="span" isEditMode={isLayoutEditMode} value={exp.startDate} onSave={(val) => onInlineEdit(`experience[${i}].startDate`, val)} placeholder="Start Date" />
                      {' - '}
                      <EditableText tagName="span" isEditMode={isLayoutEditMode} value={exp.endDate} onSave={(val) => onInlineEdit(`experience[${i}].endDate`, val)} placeholder="End Date" />
                    </div>
                    {exp.location && <div className="text-xs text-gray-500 mt-1">{exp.location}</div>}
                  </div>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: exp.description || '' }} />
              </div>
            ))}
          </div>
        </>
      );
    },
    projects: () => {
      if (!resumeData?.projects || resumeData.projects.length === 0 || !resumeData.projects[0]?.title) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Projects</h2>
          <div className="space-y-4">
            {resumeData.projects.map((proj, i) => (
              <div key={i} className="group relative">
                {isLayoutEditMode && (
                  <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDeleteSectionItem('projects', i)} className="p-1.5 text-gray-400 hover:text-red-500 bg-white shadow rounded-lg border border-gray-100"><Trash2 size={14} /></button>
                    {i === resumeData.projects.length - 1 && (
                      <button onClick={() => onAddSectionItem('projects', {title:'', link:'', description:''})} className="p-1.5 text-gray-400 hover:text-blue-500 bg-white shadow rounded-lg border border-gray-100 mt-1"><Plus size={14} /></button>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-baseline mb-1">
                  <EditableText tagName="h3" className="font-bold text-gray-900" isEditMode={isLayoutEditMode} value={proj.title} onSave={(val) => onInlineEdit(`projects[${i}].title`, val)} placeholder="Project Title" />
                  <EditableText tagName="span" className="text-sm text-gray-600 font-medium hover:underline" isEditMode={isLayoutEditMode} value={proj.link} onSave={(val) => onInlineEdit(`projects[${i}].link`, val)} placeholder="Project Link" />
                </div>
                <div className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: proj.description || '' }} />
              </div>
            ))}
          </div>
        </>
      );
    },
    education: () => {
      if (!resumeData?.education || resumeData.education.length === 0 || !resumeData.education[0]?.institution) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Education</h2>
          <div className="space-y-3">
            {resumeData.education.map((edu, i) => (
              <div key={i} className="group relative">
                {isLayoutEditMode && (
                  <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDeleteSectionItem('education', i)} className="p-1.5 text-gray-400 hover:text-red-500 bg-white shadow rounded-lg border border-gray-100"><Trash2 size={14} /></button>
                    {i === resumeData.education.length - 1 && (
                      <button onClick={() => onAddSectionItem('education', {institution:'', degree:'', startDate:'', endDate:''})} className="p-1.5 text-gray-400 hover:text-blue-500 bg-white shadow rounded-lg border border-gray-100 mt-1"><Plus size={14} /></button>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-baseline font-bold text-gray-900">
                  <EditableText tagName="span" isEditMode={isLayoutEditMode} value={edu.institution} onSave={(val) => onInlineEdit(`education[${i}].institution`, val)} placeholder="Institution" />
                  <div className="font-medium text-gray-600 text-sm">
                    <EditableText tagName="span" isEditMode={isLayoutEditMode} value={edu.startDate} onSave={(val) => onInlineEdit(`education[${i}].startDate`, val)} placeholder="Start" />
                    {' - '}
                    <EditableText tagName="span" isEditMode={isLayoutEditMode} value={edu.endDate} onSave={(val) => onInlineEdit(`education[${i}].endDate`, val)} placeholder="End" />
                  </div>
                </div>
                <EditableText tagName="div" className="text-gray-700 font-semibold italic mt-0.5" isEditMode={isLayoutEditMode} value={edu.degree} onSave={(val) => onInlineEdit(`education[${i}].degree`, val)} placeholder="Degree" />
                {edu.description && <div className="text-gray-700 mt-1" dangerouslySetInnerHTML={{ __html: edu.description }} />}
              </div>
            ))}
          </div>
        </>
      );
    },
    skills: () => {
      if (!resumeData?.skills || resumeData.skills.length === 0 || !resumeData.skills[0]) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Skills</h2>
          <div className="text-gray-800 font-medium">{resumeData.skills.filter(s => s && s.trim()).join(' • ')}</div>
        </>
      );
    },
    languages: () => {
      if (!resumeData?.languages || resumeData.languages.length === 0 || !resumeData.languages[0]) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Languages</h2>
          <div className="text-gray-800 font-medium">{resumeData.languages.map(l => typeof l === 'string' ? l : l.language).filter(l => l && l.trim()).join(' • ')}</div>
        </>
      );
    },
    achievements: () => {
      if (!resumeData?.achievements || resumeData.achievements.length === 0 || !resumeData.achievements[0]) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Achievements</h2>
          <ul className="list-disc list-inside text-gray-800">
            {resumeData.achievements.filter(a => a && a.trim()).map((achievement, i) => <li key={i}>{achievement}</li>)}
          </ul>
        </>
      );
    },
    activities: () => {
      const combined = [...(resumeData?.activities || []), ...(resumeData?.hobbies || [])].filter(item => item && item.trim());
      if (combined.length === 0) return null;
      return (
        <>
          <h2 style={sectionHeaderStyle}>Activities & Interests</h2>
          <div className="text-gray-800 font-medium">{combined.join(' • ')}</div>
        </>
      );
    }
  };
  
  // Determine which sections are actually active/populated
  const activeSections = sectionOrder.filter(key => {
    if (!sectionRenderers[key]) return false;
    const content = sectionRenderers[key]();
    return content !== null;
  });

  return (
    <div 
      className="bg-white shadow-2xl mx-auto overflow-hidden text-gray-800"
      style={{
        width: '210mm',
        minHeight: isOnePage ? '297mm' : 'auto',
        padding: '20mm',
        margin: 'auto',
        fontFamily: "'Inter', 'Poppins', sans-serif",
        lineHeight: lineHeight,
        fontSize: baseFontSize,
        boxSizing: 'border-box'
      }}
    >
      {/* Fixed Header */}
      <div className={`text-center ${sectionSpacing}`} style={{ pageBreakInside: 'avoid' }}>
        <EditableText 
          tagName="h1" 
          className={`${isOnePage ? 'text-3xl' : 'text-4xl'} font-extrabold uppercase tracking-tight text-gray-900 mb-1`} 
          isEditMode={isLayoutEditMode} 
          value={resumeData?.personalInfo?.fullName} 
          onSave={(val) => onInlineEdit('personalInfo.fullName', val)} 
          placeholder="Your Name"
        />
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 font-medium text-gray-600 mt-2">
          {resumeData?.personalInfo?.email && <span className="flex items-center">{renderIcon(Mail)} {resumeData.personalInfo.email}</span>}
          {resumeData?.personalInfo?.phone && <span className="flex items-center">{renderIcon(Phone)} {resumeData.personalInfo.phone}</span>}
          {resumeData?.personalInfo?.address && <span className="flex items-center">{renderIcon(MapPin)} {resumeData.personalInfo.address}</span>}
          {resumeData?.personalInfo?.linkedIn && <span className="flex items-center">{renderIcon(Linkedin)} {resumeData.personalInfo.linkedIn}</span>}
          {resumeData?.personalInfo?.github && <span className="flex items-center">{renderIcon(Github)} {resumeData.personalInfo.github}</span>}
        </div>
      </div>

      {/* Dynamic Draggable Sections */}
      {isLayoutEditMode ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="resume-sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {activeSections.map((sectionKey, index) => {
                  const renderer = sectionRenderers[sectionKey];
                  if (!renderer) return null;
                  const content = renderer();
                  
                  return (
                    <Draggable key={sectionKey} draggableId={sectionKey} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${sectionSpacing} relative group rounded-lg p-2 -mx-2 transition-all duration-200 ${snapshot.isDragging ? 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] scale-[1.02] ring-2 ring-blue-500 z-50 opacity-95' : 'hover:bg-blue-50/50 hover:ring-2 hover:ring-blue-400/50'}`}
                          style={{
                            ...provided.draggableProps.style,
                            pageBreakInside: 'avoid'
                          }}
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-600 bg-white shadow-md rounded-lg border border-gray-100"
                          >
                            <GripVertical size={20} />
                          </div>
                          {content}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div>
          {activeSections.map(sectionKey => {
            const renderer = sectionRenderers[sectionKey];
            if (!renderer) return null;
            const content = renderer();
            return (
              <div key={sectionKey} className={sectionSpacing} style={{ pageBreakInside: 'avoid' }}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;
