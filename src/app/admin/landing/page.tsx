'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth, adminFetch } from '../layout';

interface ConfigItem {
  id: number;
  config_key: string;
  config_value: string;
  config_type: string;
  category: string;
  description: string;
}

export default function LandingEditor() {
  const [configs, setConfigs] = useState<Record<string, ConfigItem[]>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ landing: true });
  const { accessToken } = useAuth();

  useEffect(() => {
    loadConfigs();
  }, [accessToken]);

  const loadConfigs = async () => {
    if (!accessToken) return;
    try {
      const response = await adminFetch('/api/admin/config', {}, accessToken);
      const data = await response.json();
      setConfigs(data);
      
      const initial: Record<string, string> = {};
      Object.values(data).flat().forEach((item: any) => {
        initial[item.config_key] = item.config_value;
      });
      setEditedValues(initial);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const saveAll = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    
    try {
      const changes = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
      
      const response = await adminFetch(
        '/api/admin/config/bulk',
        { method: 'PUT', body: JSON.stringify({ configs: changes }) },
        accessToken
      );
      
      const data = await response.json();
      setSaveStatus(data.success ? 'success' : 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const landingConfigs = configs['landing'] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Editor de Landing Page</h1>
          <p className="text-gray-400">Edita los textos y configuración de la página principal</p>
        </div>
        <button
          onClick={saveAll}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2 ${
            saveStatus === 'success' ? 'bg-emerald-500' : 
            saveStatus === 'error' ? 'bg-red-500' : 
            'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400'
          }`}
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
           saveStatus === 'success' ? <CheckCircle className="w-4 h-4" /> :
           saveStatus === 'error' ? <AlertCircle className="w-4 h-4" /> :
           <Save className="w-4 h-4" />}
          {isSaving ? 'Guardando...' : saveStatus === 'success' ? '¡Guardado!' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('landing')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30"
        >
          <h3 className="font-semibold text-white">Configuración Landing</h3>
          {expandedSections['landing'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        
        {expandedSections['landing'] && (
          <div className="p-6 border-t border-slate-700 space-y-4">
            {landingConfigs.map(item => (
              <div key={item.config_key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="text-sm font-medium text-gray-300">{formatLabel(item.config_key)}</label>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  {item.config_value.length > 100 ? (
                    <textarea
                      value={editedValues[item.config_key] || ''}
                      onChange={(e) => handleChange(item.config_key, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-teal-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={editedValues[item.config_key] || ''}
                      onChange={(e) => handleChange(item.config_key, e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-teal-500"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
