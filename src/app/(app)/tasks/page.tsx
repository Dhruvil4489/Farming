'use client';

import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch('/api/v1/tasks');
    const data = await res.json();
    setTasks(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (taskId: string) => {
    await fetch(`/api/v1/tasks/${taskId}/complete`, { method: 'POST' });
    fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <DataState status={loading ? 'loading' : 'success'}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Tasks & Activities</h1>
            <p className="text-xs text-stone-600 mt-1">Manage farm operational activities</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <DataState
            status="empty"
            emptyTitle="No tasks found"
            emptyDescription="All tasks for your farms have been completed or none are scheduled."
          />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'completed';

              return (
                <Card
                  key={task.id}
                  className={`flex items-start justify-between gap-4 p-4 transition-all ${
                    isDone ? 'bg-stone-50 border-stone-200 opacity-70' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => !isDone && handleComplete(task.id)}
                      disabled={isDone}
                      className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-400 hover:border-[#2F7D4F]'
                      }`}
                    >
                      {isDone && <CheckCircle2 size={16} />}
                    </button>

                    <div>
                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                        {task.title}
                      </h4>
                      {task.description && <p className="text-xs text-stone-600 mt-0.5">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500 font-medium">
                        <span>Farm: <strong>{task.farm?.name}</strong></span>
                        {task.field && <span>Field: <strong>{task.field.name}</strong></span>}
                        <span>Due: {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'Today'}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DataState>
  );
}
