import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { api } from '@/lib/api';
import { Reading, Decision } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  reading?: Reading | null;
  decision?: Decision | null;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title = "SoilSense — Agricultural Process Monitoring & Control" 
}) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [reading, setReading] = useState<Reading | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [lastReadingTime, setLastReadingTime] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agrichem_token');
      if (!token) {
        setIsAuthenticated(false);
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  const fetchTelemetry = useCallback(async () => {
    try {
      const data = await api.getLatest();
      if (data && data.reading) {
        setReading(data.reading);
        if (data.reading.timestamp) {
          setLastReadingTime(new Date(data.reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
      if (data && data.decision) {
        setDecision(data.decision);
      }
    } catch (err) {
      console.warn('Telemetry polling error:', err);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 4000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const handleScenarioTrigger = async (sc: string) => {
    try {
      const res = await api.triggerSimulation(sc);
      if (res && res.reading) {
        setReading(res.reading);
        setLastReadingTime(new Date(res.reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      if (res && res.decision) setDecision(res.decision);
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900 flex font-sans antialiased">
      <Head>
        <title>{title}</title>
        <meta name="description" content="SoilSense — Agricultural Process Monitoring and Decision Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Persistent SCADA Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          isSimulated={reading?.data_source !== 'REAL'}
          pumpStatus={reading?.pump_status || 'OFF'}
          lastReadingTime={lastReadingTime}
          onRefresh={fetchTelemetry}
          onScenarioTrigger={handleScenarioTrigger}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
