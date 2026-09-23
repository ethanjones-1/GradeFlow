import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, GraduationCap, Moon, Pencil, Plus, Sun, Trash2, X } from 'lucide-react'

function getGradeStatusStyle(avg, target) {
  if (avg === null) return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  if (avg >= target) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
  if (avg >= target - 5) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
  return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
}

function getGradeTextStyle(avg, target) {
  if (avg === null) return 'text-slate-500 dark:text-slate-400'
  if (avg >= target) return 'text-emerald-700 dark:text-emerald-300'
  if (avg >= target - 5) return 'text-amber-700 dark:text-amber-300'
  return 'text-red-700 dark:text-red-300'
}

function getDegreeClassification(score) {
  if (score >= 70) return '1st'
  if (score >= 60) return '2:1'
  if (score >= 50) return '2:2'
  if (score >= 40) return '3rd'
  return 'Fail'
}

function ClassificationBadge({ score }) {
  return (
    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
      {getDegreeClassification(score)}
    </span>
  )
}

function SummaryMetric({ label, children, valueClassName = 'text-slate-800 dark:text-slate-100' }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800 sm:block">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-base font-black sm:mt-0.5 ${valueClassName}`}>{children}</p>
    </div>
  )
}

function AssessmentRow({ assessment, neededOnRemaining, onGradeChange }) {
  const isComplete = assessment.grade !== '' && assessment.grade !== null

  return (
    <div className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition ${isComplete ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40' : 'border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isComplete ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-slate-100 text-transparent dark:border-slate-600 dark:bg-slate-700'}`}
          aria-label={isComplete ? 'Assessment complete' : 'Assessment not graded'}
          title={isComplete ? 'Assessment complete' : 'Assessment not graded'}
        >
          <CheckCircle2 size={12} />
        </div>
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{assessment.name} <span className="font-normal text-slate-500 dark:text-slate-300">({assessment.weight}%)</span></p>
          {!isComplete && neededOnRemaining !== null && <p className="mt-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">Need min: {neededOnRemaining.toFixed(1)}%</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <input type="number" placeholder="—" value={assessment.grade} onChange={(event) => onGradeChange(event.target.value)} className="w-14 rounded-xl border border-slate-200 bg-white px-2 py-1 text-center font-bold text-slate-900 outline-none shadow-sm focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        <span className="font-bold text-slate-400">%</span>
      </div>
    </div>
  )
}

const emptyModuleForm = {
  name: '',
  catts: '15',
  targetGrade: '70',
  assessments: [
    { name: 'cw1', weight: '50', grade: '' },
    { name: 'exam', weight: '50', grade: '' },
  ],
}

export default function App() {
  const [modules, setModules] = useState(() => {
    try {
      const saved = localStorage.getItem('gradeflow-modules')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [isEditingYearTarget, setIsEditingYearTarget] = useState(false)
  const [yearTargetInput, setYearTargetInput] = useState('70')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedModuleIds, setExpandedModuleIds] = useState(new Set())
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('gradeflow-theme')
    if (savedTheme) return savedTheme === 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })
  const [newModule, setNewModule] = useState(emptyModuleForm)

  useEffect(() => {
    localStorage.setItem('gradeflow-modules', JSON.stringify(modules))
  }, [modules])

  useEffect(() => {
    localStorage.setItem('gradeflow-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const processedModules = useMemo(() => {
    return modules.map((mod) => {
      const modTarget = mod.targetGrade !== undefined && mod.targetGrade !== '' ? Number(mod.targetGrade) : 70
      const graded = mod.assessments.filter((a) => a.grade !== '' && a.grade !== null)
      const ungraded = mod.assessments.filter((a) => a.grade === '' || a.grade === null)

      const totalWeight = mod.assessments.reduce((sum, a) => sum + Number(a.weight), 0)
      const gradedWeight = graded.reduce((sum, a) => sum + Number(a.weight), 0)
      const remainingWeight = ungraded.reduce((sum, a) => sum + Number(a.weight), 0)

      const earnedGradeSum = graded.reduce((sum, a) => sum + Number(a.grade) * (Number(a.weight) / 100), 0)
      
      let currentAverage = null
      if (gradedWeight > 0) {
        currentAverage = graded.reduce((sum, a) => sum + Number(a.grade) * Number(a.weight), 0) / gradedWeight
      }

      let neededOnRemaining = null
      if (remainingWeight > 0) {
        neededOnRemaining = (modTarget - earnedGradeSum) / (remainingWeight / 100)
      }

      return {
        ...mod,
        catts: Number(mod.catts) || 15,
        modTarget,
        totalWeight,
        currentAverage,
        remainingWeight,
        neededOnRemaining,
      }
    })
  }, [modules])

  const calculatedYearTarget = useMemo(() => {
    if (processedModules.length === 0) return 70
    const totalCatts = processedModules.reduce((sum, m) => sum + m.catts, 0)
    if (totalCatts === 0) return 70
    const weightedSum = processedModules.reduce((sum, m) => sum + m.modTarget * m.catts, 0)
    return weightedSum / totalCatts
  }, [processedModules])

  const overallAverage = useMemo(() => {
    const validMods = processedModules.filter((m) => m.currentAverage !== null)
    if (validMods.length === 0) return null
    const totalCatts = validMods.reduce((sum, m) => sum + m.catts, 0)
    if (totalCatts === 0) return null
    return validMods.reduce((sum, m) => sum + m.currentAverage * m.catts, 0) / totalCatts
  }, [processedModules])

  const sortedSummaryModules = useMemo(() => {
    return [...processedModules].sort((a, b) => {
      if (a.currentAverage === null) return 1
      if (b.currentAverage === null) return -1
      return b.currentAverage - a.currentAverage
    })
  }, [processedModules])

  function handleResetAllTargets() {
    const val = Number(yearTargetInput)
    if (isNaN(val)) return
    if (window.confirm(`This will reset all individual module targets to ${val}%. Continue?`)) {
      setModules((currentModules) => currentModules.map((module) => ({ ...module, targetGrade: val })))
      setIsEditingYearTarget(false)
    }
  }


  function updateModuleTargetFromTable(modId, val) {
    setModules((currentModules) => currentModules.map((module) => (
      module.id === modId ? { ...module, targetGrade: val === '' ? '' : Number(val) } : module
    )))
  }

  function handleCreateModule(e) {
    e.preventDefault()
    const totalWeight = newModule.assessments.reduce((sum, a) => sum + Number(a.weight), 0)
    if (totalWeight !== 100) {
      alert(`Total weight must equal 100%. Currently: ${totalWeight}%`)
      return
    }

    const moduleToSave = {
      id: crypto.randomUUID(),
      name: newModule.name.trim(),
      catts: Number(newModule.catts) || 15,
      targetGrade: newModule.targetGrade === '' ? 70 : Number(newModule.targetGrade),
      assessments: newModule.assessments.map((a) => ({
        id: crypto.randomUUID(),
        name: a.name.trim(),
        weight: Number(a.weight),
        grade: a.grade === '' ? '' : Number(a.grade),
      })),
    }

    setModules((currentModules) => [...currentModules, moduleToSave])
    setIsModalOpen(false)
    setNewModule(emptyModuleForm)
  }

  function updateGrade(modId, assessmentId, gradeVal) {
    setModules((currentModules) => currentModules.map((module) => (
      module.id === modId
        ? {
            ...module,
            assessments: module.assessments.map((assessment) => (
              assessment.id === assessmentId
                ? { ...assessment, grade: gradeVal === '' ? '' : Number(gradeVal) }
                : assessment
            )),
          }
        : module
    )))
  }

  function deleteModule(moduleId, moduleName) {
    if (!window.confirm(`Are you sure you want to delete ${moduleName}?`)) return
    setModules((currentModules) => currentModules.filter((module) => module.id !== moduleId))
    setExpandedModuleIds((currentIds) => {
      const nextIds = new Set(currentIds)
      nextIds.delete(moduleId)
      return nextIds
    })
  }

  function toggleModule(moduleId) {
    setExpandedModuleIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(moduleId)) nextIds.delete(moduleId)
      else nextIds.add(moduleId)
      return nextIds
    })
  }

  return (
    <main className={`${darkMode ? 'dark' : ''} min-h-screen bg-slate-50 pb-16 font-sans text-slate-900 dark:bg-[#0f172a] dark:text-slate-100`}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <header className="app-header">
        <div className="app-header-inner">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <GraduationCap size={18} />
            </div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-slate-900 dark:text-white">Grade Tracker</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode((currentMode) => !currentMode)}
              className="icon-button border border-slate-200 p-2 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="primary-button flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <Plus size={14} /> Add Module
            </button>
          </div>
        </div>
      </header>

      <div className="page-container">
        {/* Top Section: Boxes on Left, Table on Right */}
        <div className="summary-layout">
          {/* Left Column: Top Boxes */}
          <div className="summary-column">
            <div className="surface-card flex min-h-28 items-center justify-between p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Generated Year Target</p>
                {isEditingYearTarget ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={yearTargetInput}
                      autoFocus
                      onChange={(e) => setYearTargetInput(e.target.value)}
                      className="w-16 rounded-xl border border-emerald-500 px-2 py-1 text-xl font-black text-emerald-600 outline-none"
                    />
                    <button onClick={handleResetAllTargets} className="rounded-xl bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-700">Apply</button>
                    <button onClick={() => setIsEditingYearTarget(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                ) : (
                  <p className="mt-1 flex items-center gap-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{calculatedYearTarget.toFixed(1)}% <ClassificationBadge score={calculatedYearTarget} /></p>
                )}
              </div>
              <button onClick={() => { setYearTargetInput(String(Math.round(calculatedYearTarget))); setIsEditingYearTarget(true); }} className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" title="Reset all module targets">
                <Pencil size={18} />
              </button>
            </div>

            <div className="surface-card min-h-28 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Overall Average</p>
              <div className={`mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-2xl font-black ${getGradeStatusStyle(overallAverage, calculatedYearTarget)}`}>
                {overallAverage === null ? '—' : `${overallAverage.toFixed(1)}%`}
                {overallAverage !== null && <ClassificationBadge score={overallAverage} />}
              </div>
            </div>
          </div>

          {/* Right Column: Master Strategy Table */}
          <div className="strategy-card">
            <div>
              <div className="strategy-header">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Module Strategy Table</h3>
              </div>

              {sortedSummaryModules.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No modules added yet. Click 'Add Module' to start.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="strategy-grid">
                    <div className="strategy-columns">
                      <span>Module Name</span>
                      <span className="text-center">Target Grade</span>
                      <span className="text-center">Actual Average</span>
                    </div>

                    <div className="space-y-1.5">
                      {sortedSummaryModules.map((mod) => (
                        <div key={mod.id} className={`strategy-row ${getGradeStatusStyle(mod.currentAverage, mod.modTarget)}`}>
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span className="font-bold uppercase truncate text-slate-900 dark:text-slate-100">{mod.name}</span>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-300">({mod.catts} CATs)</span>
                      </div>

                      {mod.assessments.length > 0 && mod.assessments.every((assessment) => assessment.grade !== '' && assessment.grade !== null) ? (
                        <div className="flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 size={13} />
                          Complete
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white/90 px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                          <input
                            type="number"
                            value={mod.targetGrade !== undefined && mod.targetGrade !== '' ? mod.targetGrade : 70}
                            onChange={(e) => updateModuleTargetFromTable(mod.id, e.target.value)}
                            className="w-8 bg-transparent text-center text-xs font-black text-emerald-600 outline-none dark:text-emerald-400"
                          />
                          <span className="text-[10px] font-bold text-emerald-600">%</span>
                        </div>
                      )}

                      <div className="text-center font-black">
                        {mod.currentAverage === null ? '—' : `${mod.currentAverage.toFixed(1)}%`}
                      </div>
                        </div>
                      ))}
                    </div>

                    <div className="strategy-totals">
                      <span className="uppercase tracking-wider text-slate-500 dark:text-slate-300">Totals</span>
                      <span className="text-center text-sm font-black text-emerald-600 dark:text-emerald-400">{calculatedYearTarget.toFixed(1)}%</span>
                      <span className={`text-center text-sm font-black ${getGradeTextStyle(overallAverage, calculatedYearTarget)}`}>
                        {overallAverage === null ? '—' : `${overallAverage.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module Rows */}
        <div className="space-y-3">
          {processedModules.map((mod) => (
            <div key={mod.id} className="surface-card p-4 transition-shadow hover:shadow-md">
              <div className="module-header">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-slate-100">{mod.name}</h2>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{mod.catts} CATs <span className="mx-1 text-slate-300">•</span> {mod.assessments.length} assessments</p>
                  </div>
                </div>
                <div className="module-actions">
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                  >
                    {expandedModuleIds.has(mod.id) ? <><ChevronUp size={14} /> Hide details</> : <><ChevronDown size={14} /> View details</>}
                  </button>
                  <button type="button" onClick={() => deleteModule(mod.id, mod.name)} className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500" aria-label={`Delete ${mod.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {!expandedModuleIds.has(mod.id) ? (
                <div className="module-summary">
                  <div className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:block">Module overview</div>
                  <SummaryMetric label="Current average" valueClassName={getGradeTextStyle(mod.currentAverage, mod.modTarget)}>{mod.currentAverage === null ? '—' : `${mod.currentAverage.toFixed(1)}%`}</SummaryMetric>
                  <SummaryMetric label="Target grade" valueClassName="text-emerald-600 dark:text-emerald-400">{mod.modTarget}%</SummaryMetric>
                  <SummaryMetric label="Assessment progress">{mod.assessments.filter((assessment) => assessment.grade !== '' && assessment.grade !== null).length}<span className="text-sm font-semibold text-slate-400">/{mod.assessments.length}</span></SummaryMetric>
                </div>
              ) : (
              <div className="module-details">
                <div className="md:col-span-2 space-y-2">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Components & Grades</div>
                  {mod.assessments.map((assessment) => (
                    <AssessmentRow
                      key={assessment.id}
                      assessment={assessment}
                      neededOnRemaining={mod.neededOnRemaining}
                      onGradeChange={(grade) => updateGrade(mod.id, assessment.id, grade)}
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="detail-panel">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Current Average</div>
                      <div className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-lg font-black ${getGradeStatusStyle(mod.currentAverage, mod.modTarget)}`}>
                        {mod.currentAverage === null ? '—' : `${mod.currentAverage.toFixed(1)}%`}
                        {mod.currentAverage !== null && <span className="rounded-md bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-slate-900/40">{getDegreeClassification(mod.currentAverage)}</span>}
                      </div>
                    </div>

                    <div className="detail-panel">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Target</div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center text-lg font-black text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-400">
                        {mod.modTarget}%
                      </div>
                    </div>
                  </div>

                  <div className="detail-panel">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Target Requirements</div>
                    {mod.remainingWeight > 0 && mod.neededOnRemaining !== null ? (
                      <p className="font-bold text-xs text-slate-700 dark:text-slate-200">
                        Need <strong className={mod.neededOnRemaining > 100 ? 'text-red-600' : 'text-emerald-700'}>{mod.neededOnRemaining.toFixed(1)}%</strong> avg on remaining ({mod.remainingWeight}%)
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 size={15} /> All complete!
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="surface-card w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="modal-header">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Module & Weights</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateModule} className="modal-form">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-200">Module Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 130 S+P"
                    value={newModule.name}
                    onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                    className="field-input w-full px-3 py-2.5 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-200">CATs</label>
                  <input
                    type="number"
                    value={newModule.catts}
                    onChange={(e) => setNewModule({ ...newModule, catts: e.target.value })}
                    className="field-input w-full px-3 py-2.5 text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-200">Module Target %</label>
                <input
                  type="number"
                  value={newModule.targetGrade}
                  onChange={(e) => setNewModule({ ...newModule, targetGrade: e.target.value })}
                  className="field-input w-full px-3 py-2 font-bold"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-200">Components (Must total 100%)</span>
                  <button
                    type="button"
                    onClick={() => setNewModule({ ...newModule, assessments: [...newModule.assessments, { name: '', weight: '', grade: '' }] })}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    + Add Part
                  </button>
                </div>

                <div className="space-y-2">
                  {newModule.assessments.map((a, index) => (
                    <div key={index} className="assessment-form-row">
                      <input
                        type="text"
                        placeholder="Name (e.g. cw1)"
                        value={a.name}
                        onChange={(e) => {
                          const updated = [...newModule.assessments]
                          updated[index].name = e.target.value
                          setNewModule({ ...newModule, assessments: updated })
                        }}
                        className="field-input flex-1 px-3 py-2"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Wt %"
                        value={a.weight}
                        onChange={(e) => {
                          const updated = [...newModule.assessments]
                          updated[index].weight = e.target.value
                          setNewModule({ ...newModule, assessments: updated })
                        }}
                        className="field-input w-16 px-2 py-2 text-center font-bold"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Grade"
                        value={a.grade}
                        onChange={(e) => {
                          const updated = [...newModule.assessments]
                          updated[index].grade = e.target.value
                          setNewModule({ ...newModule, assessments: updated })
                        }}
                        className="field-input w-16 px-2 py-2 text-center font-bold"
                      />
                      {newModule.assessments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewModule({ ...newModule, assessments: newModule.assessments.filter((_, i) => i !== index) })}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="primary-button mt-2 w-full py-3 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
              >
                Save Module
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}