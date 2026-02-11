'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle, AlertCircle, Globe, DollarSign } from 'lucide-react';
import { useAuth, adminFetch } from '../layout';

interface ConfigItem {
  id: number;
  config_key: string;
  config_value: string;
  config_type: string;
  category: string;
  description: string;
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<Record<string, ConfigItem[]>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
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

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'general': return <Globe className="w-5 h-5 text-teal-400" />;
      case 'pricing': return <DollarSign className="w-5 h-5 text-amber-400" />;
      default: return <Settings className="w-5 h-5 text-gray-400" />;
    }
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

  const generalCategories = ['general', 'pricing', 'seo', 'dashboard'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración General</h1>
          <p className="text-gray-400">Ajustes globales del sistema</p>
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
          {isSaving ? 'Guardando...' : saveStatus === 'success' ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      {generalCategories.map(category => {
        const items = configs[category];
        if (!items || items.length === 0) return null;
        
        return (
          <div key={category} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
              {getCategoryIcon(category)}
              <h3 className="font-semibold text-white capitalize">{category}</h3>
            </div>
            <div className="p-6 space-y-4">
              {items.map(item => (
                <div key={item.config_key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div>
                    <label className="text-sm font-medium text-gray-300">{formatLabel(item.config_key)}</label>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {item.config_type === 'boolean' ? (
                      <select
                        value={editedValues[item.config_key] || 'false'}
                        onChange={(e) => handleChange(item.config_key, e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      >
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : item.config_type === 'color' ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editedValues[item.config_key] || '#000000'}
                          onChange={(e) => handleChange(item.config_key, e.target.value)}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editedValues[item.config_key] || ''}
                          onChange={(e) => handleChange(item.config_key, e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono"
                        />
                      </div>
                    ) : (
                      <input
                        type={item.config_type === 'number' ? 'number' : 'text'}
                        value={editedValues[item.config_key] || ''}
                        onChange={(e) => handleChange(item.config_key, e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-teal-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
