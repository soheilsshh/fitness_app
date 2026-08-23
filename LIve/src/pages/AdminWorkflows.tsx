import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, Plus, Edit, Trash2, Play, Pause, X, Save, Copy, 
  ChevronDown, ChevronUp, Info, Clock, Users, Mail, Phone as PhoneIcon,
  Tag, Settings, List, Activity
} from "lucide-react";
import { config } from '@/config/environment';

const API_URL = config.API_BASE_URL;

interface Workflow {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: string;
  webinar_id?: number;
  webinar?: {
    id: number;
    title: string;
  };
  steps?: WorkflowStep[];
  steps_count?: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowStep {
  id?: number;
  workflow_id?: number;
  order_index: number;
  name?: string;
  enabled?: boolean;
  
  // WHEN: Timing
  run_mode?: string; // OFFSET_FROM_TRIGGER, OFFSET_FROM_WEBINAR_START, OFFSET_FROM_WEBINAR_END, FIXED_LOCAL_TIME
  offset_minutes?: number;
  fixed_time?: string; // "HH:mm" format
  
  // Legacy timing (for backward compatibility)
  delay_minutes?: number;
  schedule_type?: string;
  relative_to?: string;
  
  // WHO: Target Segment
  target_segment?: string;
  segment_params?: string; // JSON
  
  // WHO: Conditions
  conditions?: string; // JSON: {operator: "AND"|"OR", rules: [...]}
  
  // WHAT: Action
  action_type: string;
  action_params?: string; // JSON
  
  // Legacy segment (backward compatibility)
  segment_type?: string;
  min_watch_minutes?: number;
  max_watch_minutes?: number;
  required_tag?: string;
  
  // Action-specific fields
  sms_pattern_code?: string;
  sms_sender_line?: string;
  sms_params_json?: string;
  voice_pattern_id?: string;
  update_field?: string;
  update_value?: string;
  target_workflows?: string; // JSON array or "all"
}

interface ConditionRule {
  field: string;
  comparator: string;
  value: any;
}

interface StepConditions {
  operator: "AND" | "OR";
  rules: ConditionRule[];
}

interface WorkflowLog {
  id: number;
  workflow_id: number;
  workflow_step_id: number;
  participant_id: number;
  executed_at: string;
  status: string;
  error_message?: string;
  workflow_name: string;
  participant_phone: string;
  step_order_index: number;
}

const AdminWorkflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewWorkflowId, setPreviewWorkflowId] = useState<number | null>(null);
  const [showTestRun, setShowTestRun] = useState(false);
  const [testRunWorkflowId, setTestRunWorkflowId] = useState<number | null>(null);
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/workflows`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      alert('خطا در دریافت لیست گردش‌کارها');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`${API_URL}/admin/workflows/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!response.ok) throw new Error('Failed to toggle workflow');
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
      alert('خطا در تغییر وضعیت گردش کار');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این گردش کار اطمینان دارید؟')) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/workflows/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete workflow');
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      alert('خطا در حذف گردش کار');
    }
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWorkflow(null);
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'on_registration': return 'شروع از زمان ثبت‌نام';
      case 'before_webinar': return 'نزدیک شروع وبینار';
      case 'after_webinar': return 'بعد از اتمام وبینار';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1a1f35] to-[#0A0F1E]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (showForm) {
    return (
      <WorkflowForm
        workflow={editingWorkflow}
        onClose={handleCloseForm}
        onSave={() => {
          handleCloseForm();
          fetchWorkflows();
        }}
      />
    );
  }

  if (showLogs) {
    return <WorkflowLogs onClose={() => setShowLogs(false)} />;
  }

  if (showPreview && previewWorkflowId) {
    return (
      <WorkflowPreview
        workflowId={previewWorkflowId}
        onClose={() => {
          setShowPreview(false);
          setPreviewWorkflowId(null);
        }}
      />
    );
  }

  if (showTestRun && testRunWorkflowId) {
    return (
      <WorkflowTestRun
        workflowId={testRunWorkflowId}
        onClose={() => {
          setShowTestRun(false);
          setTestRunWorkflowId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1a1f35] to-[#0A0F1E] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">گردش‌کارهای اتوماسیون</h1>
              <p className="text-gray-400">مدیریت پیام‌های خودکار و فالوآپ وبینار</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogs(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Activity className="h-4 w-4 mr-2" />
                لاگ اجراها
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                ایجاد گردش کار جدید
              </Button>
            </div>
          </div>
        </div>

        {/* Workflows List */}
        {workflows.length === 0 ? (
          <Card className="bg-white/5 border border-white/10">
            <CardContent className="py-12 text-center">
              <Settings className="h-16 w-16 mx-auto mb-4 text-gray-500 opacity-50" />
              <p className="text-gray-400 text-lg mb-4">هیچ گردش کاری یافت نشد</p>
              <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                ایجاد اولین گردش کار
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{workflow.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          workflow.is_active 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {workflow.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                      {workflow.description && (
                        <p className="text-gray-400 text-sm mb-3">{workflow.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span>{getTriggerTypeLabel(workflow.trigger_type)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <List className="h-4 w-4 text-cyan-400" />
                          <span>{workflow.steps_count || 0} مرحله</span>
                        </div>
                        {workflow.webinar && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Users className="h-4 w-4 text-green-400" />
                            <span>{workflow.webinar.title}</span>
                          </div>
                        )}
                        {!workflow.webinar_id && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Users className="h-4 w-4 text-green-400" />
                            <span>همه وبینارها</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPreviewWorkflowId(workflow.id);
                          setShowPreview(true);
                        }}
                        className="text-cyan-400 hover:text-cyan-300"
                        title="پیش‌نمایش"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTestRunWorkflowId(workflow.id);
                          setShowTestRun(true);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                        title="تست اجرا"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(workflow.id, workflow.is_active)}
                        className="text-gray-400 hover:text-white"
                        title={workflow.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                      >
                        {workflow.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(workflow)}
                        className="text-blue-400 hover:text-blue-300"
                        title="ویرایش"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(workflow.id)}
                        className="text-red-400 hover:text-red-300"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Workflow Form Component
interface WorkflowFormProps {
  workflow: Workflow | null;
  onClose: () => void;
  onSave: () => void;
}

const WorkflowForm: React.FC<WorkflowFormProps> = ({ workflow, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    is_active: workflow?.is_active ?? true,
    trigger_type: workflow?.trigger_type || 'on_registration',
    webinar_id: workflow?.webinar_id || null,
  });
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
  const [saving, setSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const token = localStorage.getItem('admin_token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = workflow 
        ? `${API_URL}/admin/workflows/${workflow.id}`
        : `${API_URL}/admin/workflows`;
      
      const method = workflow ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          steps: steps.map((step, index) => ({
            ...step,
            order_index: index,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to save workflow');
      
      alert('✅ گردش کار با موفقیت ذخیره شد');
      onSave();
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('❌ خطا در ذخیره گردش کار');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setSteps([...steps, {
      order_index: steps.length,
      delay_minutes: 0,
      action_type: 'send_sms',
      segment_type: 'all_registered',
    }]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const duplicateStep = (index: number) => {
    const step = { ...steps[index] };
    delete step.id;
    setSteps([...steps.slice(0, index + 1), step, ...steps.slice(index + 1)]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1a1f35] to-[#0A0F1E] p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <Card className="bg-white/5 border border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl">
                {workflow ? 'ویرایش گردش کار' : 'ایجاد گردش کار جدید'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">اطلاعات کلی</h3>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">نام گردش کار *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="مثال: وارم‌آپ قبل از کارگاه"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">توضیحات</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="توضیحات اختیاری..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">نوع تریگر *</label>
                    <select
                      value={formData.trigger_type}
                      onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="on_registration">شروع از زمان ثبت‌نام</option>
                      <option value="before_webinar">نزدیک شروع وبینار</option>
                      <option value="after_webinar">بعد از اتمام وبینار</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">وبینار</label>
                    <select
                      value={formData.webinar_id || ''}
                      onChange={(e) => setFormData({ ...formData, webinar_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">همه وبینارها</option>
                      {/* Add webinar options from API if needed */}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-green-500"
                  />
                  <label htmlFor="is_active" className="text-gray-300 text-sm">فعال</label>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">مراحل گردش کار</h3>
                  <Button type="button" onClick={addStep} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    افزودن مرحله
                  </Button>
                </div>

                {steps.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>هیچ مرحله‌ای اضافه نشده است</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <WorkflowStepCard
                        key={index}
                        step={step}
                        index={index}
                        expanded={expandedStep === index}
                        onToggle={() => setExpandedStep(expandedStep === index ? null : index)}
                        onUpdate={updateStep}
                        onRemove={removeStep}
                        onDuplicate={duplicateStep}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
                <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
                  انصراف
                </Button>
                <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      ذخیره گردش کار
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Workflow Step Card Component
interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
}

const WorkflowStepCard: React.FC<WorkflowStepCardProps> = ({
  step,
  index,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
  onDuplicate,
}) => {
  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'send_sms': return 'ارسال پیامک';
      case 'add_tag': return 'اضافه کردن تگ';
      case 'update_participant_field': return 'تغییر وضعیت';
      case 'stop_other_workflows': return 'توقف سایر گردش‌کارها';
      default: return type;
    }
  };

  const getSegmentTypeLabel = (type: string) => {
    switch (type) {
      case 'all_registered': return 'همه ثبت‌نام‌کننده‌ها';
      case 'not_attended': return 'ثبت‌نام کرده ولی وارد نشده';
      case 'left_early': return 'کمتر دیده و خارج شده';
      case 'attended_not_bought': return 'تماشا کرده اما نخریده';
      case 'watched_to_offer_not_bought': return 'تا پیشنهاد دیده اما نخریده';
      case 'buyers_installment': return 'خریدار قسطی';
      case 'buyers_full': return 'خریدار کامل';
      case 'custom_by_tag': return 'بر اساس تگ';
      default: return type;
    }
  };

  return (
    <Card className="bg-white/5 border border-white/10">
      <CardHeader className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </div>
            <div>
              <h4 className="text-white font-semibold">
                {step.name || getActionTypeLabel(step.action_type)}
                {step.enabled === false && (
                  <span className="mr-2 text-xs text-gray-500">(غیرفعال)</span>
                )}
              </h4>
              <p className="text-gray-400 text-xs">
                {step.run_mode === 'OFFSET_FROM_TRIGGER' && `${step.offset_minutes ?? step.delay_minutes ?? 0} دقیقه بعد از ثبت‌نام`}
                {step.run_mode === 'OFFSET_FROM_WEBINAR_START' && `${step.offset_minutes ?? 0} دقیقه از شروع وبینار`}
                {step.run_mode === 'OFFSET_FROM_WEBINAR_END' && `${step.offset_minutes ?? 0} دقیقه بعد از پایان`}
                {step.run_mode === 'FIXED_LOCAL_TIME' && `ساعت ${step.fixed_time || '18:30'}`}
                {!step.run_mode && `${step.delay_minutes ?? 0} دقیقه بعد`}
                {' • '}
                {getSegmentTypeLabel(step.target_segment || step.segment_type || 'all_registered')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onDuplicate(index); }}
              className="text-gray-400 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-4 border-t border-white/10 space-y-4">
          {/* Step Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">نام مرحله</label>
            <Input
              value={step.name || ''}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="مثال: پیامک یادآوری 2 ساعت قبل"
            />
          </div>

          {/* WHEN: Timing Section */}
          <div className="border border-white/10 rounded-lg p-4 bg-white/5">
            <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              زمان اجرا (WHEN)
            </h5>
            
            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">نوع زمان‌بندی *</label>
                <select
                  value={step.run_mode || 'OFFSET_FROM_TRIGGER'}
                  onChange={(e) => {
                    onUpdate(index, 'run_mode', e.target.value);
                    // Reset related fields when mode changes
                    if (e.target.value !== 'FIXED_LOCAL_TIME') {
                      onUpdate(index, 'fixed_time', undefined);
                    }
                    if (e.target.value === 'FIXED_LOCAL_TIME') {
                      onUpdate(index, 'offset_minutes', 0);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2"
                >
                  <option value="OFFSET_FROM_TRIGGER">X دقیقه بعد از ثبت‌نام</option>
                  <option value="OFFSET_FROM_WEBINAR_START">X دقیقه قبل/بعد از شروع وبینار</option>
                  <option value="OFFSET_FROM_WEBINAR_END">X دقیقه بعد از پایان وبینار</option>
                  <option value="FIXED_LOCAL_TIME">ساعت ثابت در روز (مثلاً 18:30)</option>
                </select>
              </div>

              {step.run_mode === 'FIXED_LOCAL_TIME' ? (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">ساعت (HH:mm) *</label>
                  <Input
                    type="time"
                    value={step.fixed_time || '18:30'}
                    onChange={(e) => {
                      const timeValue = e.target.value;
                      // Convert from HH:MM format to HH:mm
                      const [hours, minutes] = timeValue.split(':');
                      onUpdate(index, 'fixed_time', `${hours}:${minutes}`);
                    }}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-gray-500 text-xs mt-1">زمان به وقت تهران (Asia/Tehran)</p>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {step.run_mode === 'OFFSET_FROM_WEBINAR_START' 
                      ? 'دقیقه قبل/بعد از شروع وبینار (منفی = قبل، مثبت = بعد) *'
                      : step.run_mode === 'OFFSET_FROM_WEBINAR_END'
                      ? 'دقیقه بعد از پایان وبینار *'
                      : 'دقیقه بعد از ثبت‌نام *'}
                  </label>
                  <Input
                    type="number"
                    value={step.offset_minutes ?? step.delay_minutes ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      onUpdate(index, 'offset_minutes', val);
                      // Also update legacy field for backward compatibility
                      onUpdate(index, 'delay_minutes', val);
                    }}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="مثال: -120 برای 2 ساعت قبل، 30 برای 30 دقیقه بعد"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    {step.run_mode === 'OFFSET_FROM_WEBINAR_START' && (
                      <>مثال: -120 = 2 ساعت قبل از شروع، 30 = 30 دقیقه بعد از شروع</>
                    )}
                    {step.run_mode === 'OFFSET_FROM_WEBINAR_END' && (
                      <>مثال: 0 = بلافاصله بعد، 30 = 30 دقیقه بعد</>
                    )}
                    {step.run_mode === 'OFFSET_FROM_TRIGGER' && (
                      <>مثال: 0 = بلافاصله، 60 = یک ساعت بعد، 1440 = یک روز بعد</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* WHAT: Action Section */}
          <div className="border border-white/10 rounded-lg p-4 bg-white/5">
            <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-yellow-400" />
              اکشن (WHAT)
            </h5>
            
            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">نوع اکشن *</label>
                <select
                  value={step.action_type}
                  onChange={(e) => onUpdate(index, 'action_type', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2"
                >
                  <option value="send_sms">📱 ارسال پیامک</option>
                  <option value="add_tag">🏷️ اضافه کردن تگ</option>
                  <option value="update_participant_field">✏️ تغییر وضعیت کاربر</option>
                  <option value="stop_other_workflows">⛔ توقف سایر گردش‌کارها</option>
                </select>
              </div>

          {/* WHO: Target Segment Section */}
          <div className="border border-white/10 rounded-lg p-4 bg-white/5">
            <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              مخاطب (WHO)
            </h5>
            
            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">گروه هدف *</label>
                <select
                  value={step.target_segment || step.segment_type || 'all_registered'}
                  onChange={(e) => {
                    onUpdate(index, 'target_segment', e.target.value);
                    // Also update legacy field
                    onUpdate(index, 'segment_type', e.target.value);
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2"
                >
                  <option value="all_registered">همه ثبت‌نام‌کننده‌ها</option>
                  <option value="registered_not_joined">ثبت‌نام کرده ولی وارد نشده</option>
                  <option value="joined_less_than_X_minutes">کمتر از X دقیقه دیده</option>
                  <option value="joined_more_than_X_minutes">بیشتر از X دقیقه دیده</option>
                  <option value="watched_offer_but_not_bought">تا پیشنهاد دیده اما نخریده</option>
                  <option value="buyers_full">خریدار کامل</option>
                  <option value="buyers_installment">خریدار قسطی</option>
                  <option value="by_tag">بر اساس تگ</option>
                  {/* Legacy options for backward compatibility */}
                  <option value="not_attended">[Legacy] ثبت‌نام کرده ولی وارد نشده</option>
                  <option value="left_early">[Legacy] کمتر دیده و خارج شده</option>
                  <option value="attended_not_bought">[Legacy] تماشا کرده اما نخریده</option>
                  <option value="watched_to_offer_not_bought">[Legacy] تا پیشنهاد دیده اما نخریده</option>
                  <option value="custom_by_tag">[Legacy] بر اساس تگ</option>
                </select>
              </div>

              {/* Segment Parameters */}
              {(step.target_segment === 'joined_less_than_X_minutes' || 
                step.target_segment === 'joined_more_than_X_minutes' ||
                step.segment_type === 'left_early' || 
                step.segment_type === 'watched_to_offer_not_bought') && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {step.target_segment === 'joined_less_than_X_minutes' 
                      ? 'حداکثر دقیقه تماشا'
                      : step.target_segment === 'joined_more_than_X_minutes'
                      ? 'حداقل دقیقه تماشا'
                      : step.segment_type === 'left_early'
                      ? 'حداکثر دقیقه تماشا'
                      : 'حداقل دقیقه تماشا'}
                  </label>
                  <Input
                    type="number"
                    value={
                      step.target_segment === 'joined_less_than_X_minutes' || step.segment_type === 'left_early'
                        ? (step.max_watch_minutes || '')
                        : (step.min_watch_minutes || '')
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || undefined;
                      if (step.target_segment === 'joined_less_than_X_minutes' || step.segment_type === 'left_early') {
                        onUpdate(index, 'max_watch_minutes', val);
                        // Update segment_params
                        const params = { thresholdMinutes: val };
                        onUpdate(index, 'segment_params', JSON.stringify(params));
                      } else {
                        onUpdate(index, 'min_watch_minutes', val);
                        const params = { thresholdMinutes: val };
                        onUpdate(index, 'segment_params', JSON.stringify(params));
                      }
                    }}
                    className="bg-white/5 border-white/10 text-white"
                    min="0"
                    placeholder="مثال: 30"
                  />
                </div>
              )}

              {(step.target_segment === 'by_tag' || step.segment_type === 'custom_by_tag') && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">نام تگ *</label>
                  <Input
                    value={step.required_tag || ''}
                    onChange={(e) => {
                      onUpdate(index, 'required_tag', e.target.value);
                      const params = { tag: e.target.value };
                      onUpdate(index, 'segment_params', JSON.stringify(params));
                    }}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="مثال: hot_lead"
                  />
                </div>
              )}

              {/* Advanced Conditions */}
              <ConditionsBuilder
                step={step}
                index={index}
                onUpdate={onUpdate}
              />
            </div>
          </div>


          {/* SMS Fields */}
          {step.action_type === 'send_sms' && (
            <>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">کد پترن *</label>
                <Input
                  value={step.sms_pattern_code || ''}
                  onChange={(e) => onUpdate(index, 'sms_pattern_code', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="مثال: 123456"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">پارامترها (JSON)</label>
                <Textarea
                  value={step.sms_params_json || ''}
                  onChange={(e) => onUpdate(index, 'sms_params_json', e.target.value)}
                  className="bg-white/5 border-white/10 text-white font-mono text-xs"
                  placeholder='{"name": "{{first_name}}", "time": "{{webinar_start_time}}"}'
                  rows={4}
                />
                <p className="text-gray-500 text-xs mt-1">
                  Placeholders: {'{{'} first_name {'}}'}, {'{{'} last_name {'}}'}, {'{{'} phone {'}}'}, {'{{'} webinar_title {'}}'}, {'{{'} webinar_start_time {'}}'}, {'{{'} webinar_end_time {'}}'}
                </p>
              </div>
            </>
          )}


          {/* Add Tag Fields */}
          {step.action_type === 'add_tag' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">تگ *</label>
              <Input
                value={step.update_value || ''}
                onChange={(e) => onUpdate(index, 'update_value', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="مثال: warmup_sent"
              />
            </div>
          )}

          {/* Update Field */}
          {step.action_type === 'update_participant_field' && (
            <>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">فیلد *</label>
                <select
                  value={step.update_field || ''}
                  onChange={(e) => onUpdate(index, 'update_field', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2"
                >
                  <option value="">انتخاب کنید</option>
                  <option value="purchase_status">وضعیت خرید</option>
                  <option value="tags">تگ‌ها</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">مقدار جدید *</label>
                <Input
                  value={step.update_value || ''}
                  onChange={(e) => onUpdate(index, 'update_value', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="مثال: installment یا none یا full"
                />
              </div>
            </>
          )}

          {/* Stop Other Workflows */}
          {step.action_type === 'stop_other_workflows' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">گردش‌کارهای هدف *</label>
              <select
                value={step.target_workflows === 'all' || !step.target_workflows ? 'all' : 'specific'}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    onUpdate(index, 'target_workflows', 'all');
                  } else {
                    onUpdate(index, 'target_workflows', '[]');
                  }
                }}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2"
              >
                <option value="all">همه گردش‌کارها</option>
                <option value="specific">گردش‌کارهای خاص (JSON array)</option>
              </select>
              {step.target_workflows && step.target_workflows !== 'all' && (
                <Textarea
                  value={step.target_workflows || '[]'}
                  onChange={(e) => onUpdate(index, 'target_workflows', e.target.value)}
                  className="mt-2 bg-white/5 border-white/10 text-white font-mono text-sm"
                  placeholder='[1, 2, 3]'
                  rows={2}
                />
              )}
            </div>
          )}
            </div>
          </div>

          {/* Step Enable/Disable */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <input
              type="checkbox"
              id={`step-enabled-${index}`}
              checked={step.enabled !== false}
              onChange={(e) => onUpdate(index, 'enabled', e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-600 focus:ring-green-500"
            />
            <label htmlFor={`step-enabled-${index}`} className="text-gray-300 text-sm">
              این مرحله فعال است
            </label>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Workflow Logs Component
interface WorkflowLogsProps {
  onClose: () => void;
}

const WorkflowLogs: React.FC<WorkflowLogsProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/workflow-logs?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      alert('خطا در دریافت لاگ‌ها');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1a1f35] to-[#0A0F1E] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white/5 border border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl">لاگ اجرای گردش‌کارها</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>هیچ لاگی یافت نشد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border ${
                      log.status === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.status === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {log.status === 'success' ? '✓ موفق' : '✗ خطا'}
                          </span>
                          <span className="text-white font-semibold">{log.workflow_name}</span>
                          <span className="text-gray-400 text-sm">مرحله {log.step_order_index + 1}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span>{log.participant_phone}</span>
                          <span>{new Date(log.executed_at).toLocaleString('fa-IR')}</span>
                        </div>
                        {log.error_message && (
                          <div className="mt-2 text-sm text-red-400 font-mono bg-black/20 p-2 rounded">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Conditions Builder Component
interface ConditionsBuilderProps {
  step: WorkflowStep;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
}

const ConditionsBuilder: React.FC<ConditionsBuilderProps> = ({ step, index, onUpdate }) => {
  const [showConditions, setShowConditions] = useState(false);
  const [conditions, setConditions] = useState<StepConditions>(() => {
    if (step.conditions) {
      try {
        return JSON.parse(step.conditions);
      } catch {
        return { operator: 'AND', rules: [] };
      }
    }
    return { operator: 'AND', rules: [] };
  });

  const updateConditions = (newConditions: StepConditions) => {
    setConditions(newConditions);
    onUpdate(index, 'conditions', JSON.stringify(newConditions));
  };

  const addRule = () => {
    updateConditions({
      ...conditions,
      rules: [...conditions.rules, { field: '', comparator: '==', value: '' }]
    });
  };

  const updateRule = (ruleIndex: number, field: keyof ConditionRule, value: any) => {
    const newRules = [...conditions.rules];
    newRules[ruleIndex] = { ...newRules[ruleIndex], [field]: value };
    updateConditions({ ...conditions, rules: newRules });
  };

  const removeRule = (ruleIndex: number) => {
    updateConditions({
      ...conditions,
      rules: conditions.rules.filter((_, i) => i !== ruleIndex)
    });
  };

  const fieldOptions = [
    { value: 'total_watch_minutes', label: 'دقیقه تماشا' },
    { value: 'purchase_status', label: 'وضعیت خرید' },
    { value: 'has_tag', label: 'دارای تگ' },
    { value: 'registered_today', label: 'ثبت‌نام امروز' },
    { value: 'joined_webinar', label: 'وارد وبینار شده' },
    { value: 'cta_clicked', label: 'کلیک روی CTA' },
  ];

  const comparatorOptions = [
    { value: '==', label: 'برابر با' },
    { value: '!=', label: 'مخالف' },
    { value: '>', label: 'بزرگتر از' },
    { value: '>=', label: 'بزرگتر یا مساوی' },
    { value: '<', label: 'کوچکتر از' },
    { value: '<=', label: 'کوچکتر یا مساوی' },
    { value: 'CONTAINS', label: 'شامل' },
    { value: 'NOT_CONTAINS', label: 'شامل نباشد' },
    { value: 'IN', label: 'در لیست' },
    { value: 'NOT_IN', label: 'در لیست نباشد' },
    { value: 'is_null', label: 'خالی باشد' },
    { value: 'not_null', label: 'پر باشد' },
  ];

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowConditions(!showConditions)}
        className="w-full border-teal-500/30 text-cyan-400 hover:bg-teal-500/10"
      >
        <Settings className="h-4 w-4 mr-2" />
        فیلتر پیشرفته (Conditions)
        {conditions.rules.length > 0 && (
          <span className="mr-2 px-2 py-0.5 bg-teal-500/20 rounded text-xs">
            {conditions.rules.length}
          </span>
        )}
      </Button>
      
      {step.conditions && conditions.rules.length > 0 && (
        <p className="text-xs text-green-400 mt-1">
          ✓ {conditions.rules.length} شرط فعال ({conditions.operator})
        </p>
      )}

      {showConditions && (
        <div className="mt-3 p-3 border border-teal-500/30 rounded-lg bg-teal-500/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm font-medium">اگر</span>
            <select
              value={conditions.operator}
              onChange={(e) => updateConditions({ ...conditions, operator: e.target.value as 'AND' | 'OR' })}
              className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 text-sm"
            >
              <option value="AND">همه شرایط (AND)</option>
              <option value="OR">حداقل یکی (OR)</option>
            </select>
            <span className="text-white text-sm font-medium">برقرار باشد:</span>
          </div>

          <div className="space-y-2">
            {conditions.rules.map((rule, ruleIndex) => (
              <div key={ruleIndex} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                <select
                  value={rule.field}
                  onChange={(e) => updateRule(ruleIndex, 'field', e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="">انتخاب فیلد</option>
                  {fieldOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <select
                  value={rule.comparator}
                  onChange={(e) => updateRule(ruleIndex, 'comparator', e.target.value)}
                  className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 text-sm"
                >
                  {comparatorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {!['is_null', 'not_null'].includes(rule.comparator) && (
                  <Input
                    value={typeof rule.value === 'string' ? rule.value : String(rule.value || '')}
                    onChange={(e) => {
                      let val: any = e.target.value;
                      // Try to parse as number if field is numeric
                      if (rule.field === 'total_watch_minutes' && !isNaN(Number(val))) {
                        val = Number(val);
                      }
                      updateRule(ruleIndex, 'value', val);
                    }}
                    className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                    placeholder="مقدار"
                  />
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeRule(ruleIndex)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={addRule}
            variant="outline"
            size="sm"
            className="mt-2 w-full border-teal-500/30 text-cyan-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            افزودن شرط
          </Button>
        </div>
      )}
    </div>
  );
};

// Workflow Preview Component
interface WorkflowPreviewProps {
  workflowId: number;
  onClose: () => void;
}

const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ workflowId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [webinarId, setWebinarId] = useState<string>('');
  const token = localStorage.getItem('admin_token');

  const fetchPreview = async () => {
    if (!userId) {
      alert('لطفاً user_id را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const url = `${API_URL}/admin/workflows/${workflowId}/preview?user_id=${userId}${webinarId ? `&webinar_id=${webinarId}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
      alert('خطا در دریافت پیش‌نمایش');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1a1f35] to-[#0A0F1E] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white/5 border border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl">پیش‌نمایش گردش کار</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">User ID *</label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="مثال: 123"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Webinar ID (اختیاری)</label>
                <Input
                  value={webinarId}
                  onChange={(e) => setWebinarId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="مثال: 456"
                />
              </div>
              <Button onClick={fetchPreview} disabled={loading || !userId} className="bg-teal-600 hover:bg-teal-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    در حال بارگذاری...
                  </>
                ) : (
                  <>
                    <Info className="h-4 w-4 mr-2" />
                    نمایش پیش‌نمایش
                  </>
                )}
              </Button>
            </div>

            {previewData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-gray-400 text-sm">گردش کار</p>
                    <p className="text-white font-semibold">{previewData.workflow?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">کاربر</p>
                    <p className="text-white font-semibold">{previewData.user?.name} ({previewData.user?.phone})</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-white font-semibold mb-3">مراحل:</h4>
                  {previewData.preview?.map((step: any, index: number) => (
                    <Card key={index} className={`bg-white/5 border ${
                      step.will_execute ? 'border-green-500/30' : 'border-red-500/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {step.order_index + 1}
                              </span>
                              <h5 className="text-white font-semibold">{step.step_name || `مرحله ${step.order_index + 1}`}</h5>
                              <span className={`px-2 py-1 rounded text-xs ${
                                step.will_execute ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {step.will_execute ? '✓ اجرا می‌شود' : '✗ رد می‌شود'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 space-y-1">
                              <p>زمان: {step.human_readable}</p>
                              <p>نوع: {step.action_type}</p>
                              <p>Segment: {step.segment_match ? '✓' : '✗'}</p>
                              <p>Conditions: {step.conditions_match ? '✓' : '✗'}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Workflow Test Run Component
interface WorkflowTestRunProps {
  workflowId: number;
  onClose: () => void;
}

const WorkflowTestRun: React.FC<WorkflowTestRunProps> = ({ workflowId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [webinarId, setWebinarId] = useState<string>('');
  const token = localStorage.getItem('admin_token');

  const runTest = async () => {
    if (!userId) {
      alert('لطفاً user_id را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/workflows/${workflowId}/test-run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          webinar_id: webinarId ? parseInt(webinarId) : null,
          dry_run: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to run test');
      const data = await response.json();
      setTestData(data);
    } catch (error) {
      console.error('Failed to run test:', error);
      alert('خطا در اجرای تست');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1a1f35] to-[#0A0F1E] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white/5 border border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl">تست گردش کار (Dry Run)</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">User ID *</label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="مثال: 123"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Webinar ID (اختیاری)</label>
                <Input
                  value={webinarId}
                  onChange={(e) => setWebinarId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="مثال: 456"
                />
              </div>
              <Button onClick={runTest} disabled={loading || !userId} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    در حال اجرا...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    اجرای تست
                  </>
                )}
              </Button>
            </div>

            {testData && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-gray-400 text-sm">گردش کار</p>
                    <p className="text-white font-semibold">{testData.workflow?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">کاربر</p>
                    <p className="text-white font-semibold">{testData.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">خلاصه</p>
                    <p className="text-white font-semibold">
                      {testData.summary?.will_execute}/{testData.summary?.total_steps} اجرا می‌شود
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-white font-semibold mb-3">نتایج تست:</h4>
                  {testData.test_results?.map((result: any, index: number) => (
                    <Card key={index} className={`bg-white/5 border ${
                      result.will_execute ? 'border-green-500/30' : 'border-red-500/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {result.order_index + 1}
                              </span>
                              <h5 className="text-white font-semibold">{result.step_name || `مرحله ${result.order_index + 1}`}</h5>
                              <span className={`px-2 py-1 rounded text-xs ${
                                result.will_execute ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {result.will_execute ? '✓ اجرا می‌شود' : '✗ رد می‌شود'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 space-y-1">
                              <p>زمان: {result.human_readable}</p>
                              <p>نوع: {result.action_type}</p>
                              <p>Segment: {result.segment_match ? '✓' : '✗'}</p>
                              <p>Conditions: {result.conditions_match ? '✓' : '✗'}</p>
                              <p className="text-xs text-gray-500 mt-2">دلیل: {result.reason}</p>
                              {result.action_payload && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-blue-400">نمایش Payload</summary>
                                  <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto">
                                    {JSON.stringify(JSON.parse(result.action_payload), null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWorkflows;

