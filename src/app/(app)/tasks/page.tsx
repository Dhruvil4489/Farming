'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, CheckCircle2, Trash2, X, Calendar } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/providers/I18nProvider';

export default function TasksPage() {
  const { t, locale } = useI18n();
  const [tasks, setTasks] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Add Task modal
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    farmId: '',
    fieldId: '',
    type: 'custom',
    priority: 'medium',
    dueAt: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskRes, farmRes] = await Promise.all([
        fetch(`/api/v1/tasks?lang=${locale}`),
        fetch('/api/v1/farms'),
      ]);
      if (!taskRes.ok) throw new Error(`HTTP ${taskRes.status}`);
      const taskData = await taskRes.json();
      setTasks(taskData.data || []);

      if (farmRes.ok) {
        const farmData = await farmRes.json();
        const fList = farmData.data || [];
        setFarms(fList);
        if (fList.length > 0) {
          setNewTask((prev) => ({ ...prev, farmId: prev.farmId || fList[0].id }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve farm tasks');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchTasks();
}, [fetchTasks]);

const handleComplete = async (taskId: string) => {
  try {
    const res = await fetch(`/api/v1/tasks/${taskId}/complete`, { method: 'POST' });
    if (res.ok) fetchTasks();
  } catch (err) {
    console.error('Failed to complete task:', err);
  }
};

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((item) => item.id !== taskId));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.farmId) {
      setCreateError('Please add a farm first before creating a task.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          farmId: newTask.farmId,
          fieldId: newTask.fieldId || undefined,
          type: newTask.type,
          priority: newTask.priority,
          dueAt: newTask.dueAt || undefined,
          description: newTask.description.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Could not add task.');
      setShowAdd(false);
      setNewTask((prev) => ({ ...prev, title: '', description: '', fieldId: '' }));
      await fetchTasks();
    } catch (err: any) {
      setCreateError(err.message || 'Could not add task.');
    } finally {
      setCreating(false);
    }
  };

  const selectedFarmObj = farms.find((f) => f.id === newTask.farmId);
  const filteredTasks = tasks.filter((item) => {
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error || undefined}
      onRetry={fetchTasks}
    >
      <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
                {t('tasks', 'Tasks & Activities')}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                {t('tasks_subtitle', 'Plan daily irrigation, fertilizer, and field work reminders')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter tasks by status"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                <option value="all">{t('filter_all', 'All Tasks')}</option>
                <option value="pending">{t('filter_pending', 'Pending')}</option>
                <option value="completed">{t('filter_completed', 'Completed')}</option>
              </select>
              <Button
                size="sm"
                onClick={() => setShowAdd(true)}
                className="bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl"
              >
                <Plus size={15} className="mr-1" /> {t('add_task', 'Add Task')}
              </Button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <DataState
              status="empty"
              emptyTitle={t('empty_tasks_title', 'No tasks found')}
              emptyDescription={t('empty_tasks_desc', 'You are all caught up! Add a farming task or reminder whenever you need.')}
              emptyAction={
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  <Plus size={14} className="mr-1" /> {t('add_first_task', 'Add First Task')}
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isDone = task.status === 'completed';

                return (
                <Card
                  key={task.id}
                  className={`flex items-start justify-between gap-4 p-4 rounded-2xl transition-all ${
                    isDone ? 'bg-stone-50 border-stone-200 opacity-75' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      aria-label={isDone ? `Task completed: ${task.title}` : `Mark task as completed: ${task.title}`}
                      onClick={() => !isDone && handleComplete(task.id)}
                      disabled={isDone}
                      className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-400 hover:border-[#2F7D4F]'
                      }`}
                    >
                      {isDone && <CheckCircle2 size={15} />}
                    </button>

                    <div>
                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                        {task.title}
                      </h4>
                      {task.description && <p className="text-xs text-stone-600 mt-0.5">{task.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-500 font-medium">
                        <span>{t('farm', 'Farm')}: <strong>{task.farm?.name}</strong></span>
                        {task.field && <span>{t('field', 'Field')}: <strong>{task.field.name}</strong></span>}
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} />
                          {t('due_date', 'Due')}: {task.dueAt ? new Date(task.dueAt).toLocaleDateString(locale === 'hi' ? 'hi-IN' : locale === 'gu' ? 'gu-IN' : 'en-IN') : t('today', 'Today')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${
                        task.priority === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {t(`priority_${task.priority}`, task.priority)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      aria-label="Delete task"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
          );
            })}
        </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-[#143D2A]">{t('add_task', 'Add Farming Task')}</h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {createError}
              </div>
            )}

            {farms.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-stone-600">Add a farm first to schedule tasks.</p>
                <Link href="/farms/new">
                  <Button size="sm">Add Farm</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t('task_title', 'Task Title')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apply Urea top dressing, Run morning drip"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('farm', 'Farm')} *</label>
                    <select
                      value={newTask.farmId}
                      onChange={(e) => setNewTask({ ...newTask, farmId: e.target.value, fieldId: '' })}
                      className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm bg-white"
                      required
                    >
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('field', 'Field')} ({t('optional', 'Optional')})</label>
                    <select
                      value={newTask.fieldId}
                      onChange={(e) => setNewTask({ ...newTask, fieldId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm bg-white"
                    >
                      <option value="">{t('whole_farm', 'Whole Farm')}</option>
                      {(selectedFarmObj?.fields || []).map((fld: any) => (
                        <option key={fld.id} value={fld.id}>
                          {fld.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('due_date', 'Due Date')}</label>
                    <input
                      type="date"
                      value={newTask.dueAt}
                      onChange={(e) => setNewTask({ ...newTask, dueAt: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">{t('priority', 'Priority')}</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm bg-white"
                    >
                      <option value="low">{t('priority_low', 'Low')}</option>
                      <option value="medium">{t('priority_medium', 'Medium')}</option>
                      <option value="high">{t('priority_high', 'High (Urgent)')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                    {t('cancel', 'Cancel')}
                  </Button>
                  <Button type="submit" size="sm" isLoading={creating}>
                    {t('save_task', 'Save Task')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DataState>
  );
}
