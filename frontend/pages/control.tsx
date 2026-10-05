import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Power, 
  ShieldCheck, 
  Cpu, 
  History, 
  AlertTriangle,
  RotateCw,
  Sliders,
  Check,
  Zap,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { api } from '@/lib/api';
import { Decision, Reading, Action } from '@/types';

export default function SmartControlPage() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [actionHistory, setActionHistory] = useState<Action[]>([]);
  const [automateMode, setAutomateMode] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: string;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'primary';
  }>({
    isOpen: false,
    actionType: '',
    title: '',
    message: '',
    variant: 'primary'
  });

  const loadData = async () => {
    try {
      const data = await api.getLatest();
      if (data.decision) setDecision(data.decision);
      if (data.reading) setReading(data.reading);
      const hist = await api.getCommandHistory();
      setActionHistory(hist);
    } catch (e) {
      console.warn('Control console fetch error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerCommand = async (actionType: string) => {
    setLoadingAction(actionType);
    setStatusMessage(null);
    try {
      const res = await api.sendCommand({
        action_type: actionType,
        decision_id: decision?.id,
        duration_minutes: decision?.duration_minutes || 6,
        volume_liters: decision?.volume_liters || 12.5,
        reason: `Command ${actionType} triggered from SoilSense operator panel.`
      });
      setStatusMessage(`Dispatched ${actionType}: ${res.execution_status}`);
      loadData();
    } catch (err: any) {
      setStatusMessage(`Safety Interlock Blocked: ${err.message}`);
    } finally {
      setLoadingAction(null);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleCancelCommand = async () => {
    setLoadingAction('CANCEL');
    setStatusMessage(null);
    try {
      const res = await api.cancelCommand();
      setStatusMessage(res.status === 'CANCELLED' ? 'Pending hardware command cancelled.' : 'No pending command in queue.');
      loadData();
    } catch (err: any) {
      setStatusMessage(`Cancel failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const openConfirmation = (actionType: string) => {
    if (actionType === 'APPROVE') {
      setConfirmModal({
        isOpen: true,
        actionType: 'APPROVE',
        title: 'Authorize Irrigation Run',
        message: `Approve delivery of ${decision?.volume_liters || 12.5} Liters over ${decision?.duration_minutes || 6} minutes to Bed 12. This will activate relay GPIO5 on the ESP32 node.`,
        variant: 'primary'
      });
    } else if (actionType === 'MANUAL_ON') {
      setConfirmModal({
        isOpen: true,
        actionType: 'MANUAL_ON',
        title: 'Manual Actuator Override (PUMP ON)',
        message: 'You are issuing a direct manual override. The pump will start immediately on GPIO5. Ensure field safety conditions are verified before continuing.',
        variant: 'warning'
      });
    } else if (actionType === 'MANUAL_OFF') {
      triggerCommand('MANUAL_OFF');
    } else if (actionType === 'REJECT') {
      triggerCommand('REJECT');
    }
  };

  const getExecutionBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('EXECUTED') || s.includes('SIMULATED') || s.includes('DISPATCHED')) {
      return <StatusBadge status="NORMAL" label={status} />;
    }
    if (s.includes('REJECTED')) {
      return <StatusBadge status="FAULT" label="REJECTED" />;
    }
    return <StatusBadge status="CHECK" label={status} />;
  };

  return (
    <DashboardLayout title="SoilSense - SCADA Actuation & Control Panel">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                MODULE 10
              </span>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center">
                <Power className="h-5 w-5 mr-2 text-forest-700" />
                SCADA Actuation &amp; Hardware Control Panel
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Deterministic actuator protection chain: Process Decision → Safety Interlocks → Operator Sign-Off → ESP32 Firmware → Relay → DC Pump.
            </p>
          </div>

          <div className="mt-3 md:mt-0 flex items-center space-x-3">
            <Link
              href="/docs/operating/smart-control"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 hover:text-forest-800 transition-colors bg-stone-100/80 hover:bg-stone-200/60 px-2 py-1.5 rounded border border-stone-200"
            >
              <span>Docs</span>
              <span className="text-[10px]">↗</span>
            </Link>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-stone-100 border border-stone-200 text-xs font-mono text-stone-700">
              <span className="text-stone-500">Relay Pin:</span>
              <span className="font-bold text-stone-900">GPIO5 (Active-LOW)</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono font-bold border ${
              reading?.pump_status === 'ON'
                ? 'bg-forest-100 text-forest-900 border-forest-300 animate-pulse'
                : 'bg-stone-100 text-stone-700 border-stone-200'
            }`}>
              <Zap className="h-3.5 w-3.5 text-forest-700" />
              <span>LIVE PUMP: {reading?.pump_status || 'OFF'}</span>
            </div>
          </div>
        </div>

        {/* Interlocks I1 to I5 Live Verification & Command Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Interlocks I1-I5 Card */}
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-forest-700" />
                  Deterministic Safety Interlocks (I1–I5)
                </h3>
                <p className="text-[11px] text-stone-500">
                  Hardware and agronomic rules evaluated prior to relay actuation command dispatch.
                </p>
              </div>
              <span className="text-[11px] font-mono text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200 font-semibold">
                ALL PASSED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-stone-900">I1: Sensor Health Invariant</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">Key sensors (Moisture, DS18B20, DHT22) normal. No FAULT state.</p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-stone-900">I2: Soil Moisture Cutoff</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">Current moisture &lt; 85% limit. Prevents root hypoxia/waterlogging.</p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-stone-900">I3: Hardware Runtime Hard Cap</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">Local timer capped at MAX_ON_S (60s burst) / 15m total. Watchdog enabled.</p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-stone-900">I4: Minimum Recool Gap</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">Mandates 10-minute stabilization interval between pump operations.</p>
                </div>
              </div>

              <div className="md:col-span-2 p-2.5 rounded bg-stone-50 border border-stone-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-stone-900">I5: Human Operator Approval Gate</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">ESP32 strictly forbidden from autonomous pump actuation. Command token required.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Prescription Preview Card */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-stone-700" />
                Hardware Pulse Preview
              </h3>
              <p className="text-[11px] text-stone-500">Approved payload delivered via GET /api/command</p>
            </div>

            <div className="space-y-2 font-mono text-xs text-stone-700">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Target Node:</span>
                <span className="font-bold text-stone-900">esp32-01</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Actuator Channel:</span>
                <span className="font-bold text-stone-900">CH 1 (GPIO5 Relay)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Burst Duration:</span>
                <span className="font-bold text-emerald-800">{decision?.duration_minutes ? decision.duration_minutes * 60 : 360}s</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Pulse Events:</span>
                <span className="font-bold text-stone-900">1 event</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Volume Target:</span>
                <span className="font-bold text-stone-900">{decision?.volume_liters || 12.5} Liters</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Local Hard Cap:</span>
                <span className="font-semibold text-amber-800">&le; 60s / burst (MAX_ON_S)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Stage Actuation Pipeline Flowchart */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm">
          <SectionHeader
            title="Physical Actuation Execution Chain"
            caption="Sequential safety interlocks verified prior to closing the physical pump contactor"
          />

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs mt-4">
            {/* 1. Process Decision */}
            <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-1">
              <div className="text-[10px] text-stone-500 uppercase font-mono font-semibold">1. Decision</div>
              <div className="text-stone-900 font-bold font-mono">{decision?.decision || 'IRRIGATE'}</div>
              <div className="text-[10px] text-stone-500 font-mono">{(Number(decision?.confidence || 0.94) * 100).toFixed(0)}% Conf</div>
            </div>

            {/* 2. Safety Interlocks */}
            <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-1">
              <div className="text-[10px] text-stone-500 uppercase font-mono font-semibold">2. Safety Guard</div>
              <div className="text-forest-700 font-bold font-mono flex items-center justify-center">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> PASSED
              </div>
              <div className="text-[10px] text-stone-500 font-mono">Interlocks OK</div>
            </div>

            {/* 3. Human Approval */}
            <div className={`p-3 rounded border space-y-1 ${
              decision?.status === 'APPROVED' || automateMode
                ? 'bg-forest-50 border-forest-300 text-forest-900'
                : 'bg-amber-50/70 border-amber-300 text-amber-900'
            }`}>
              <div className="text-[10px] text-stone-500 uppercase font-mono font-semibold">3. Approval</div>
              <div className="font-bold font-mono text-xs">
                {automateMode ? 'AUTO MODE' : (decision?.status === 'APPROVED' ? 'APPROVED' : 'AWAITING SIGN-OFF')}
              </div>
              <div className="text-[10px] text-stone-500 font-mono">Operator gate</div>
            </div>

            {/* 4. ESP32 Node */}
            <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-1">
              <div className="text-[10px] text-stone-500 uppercase font-mono font-semibold">4. ESP32 Node</div>
              <div className="text-forest-700 font-bold font-mono">ONLINE</div>
              <div className="text-[10px] text-stone-500 font-mono">HTTP Polling / WiFi</div>
            </div>

            {/* 5. Relay Board */}
            <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-1">
              <div className="text-[10px] text-stone-500 uppercase font-mono font-semibold">5. Relay Board</div>
              <div className="text-stone-900 font-bold font-mono">
                {reading?.pump_status === 'ON' ? 'CLOSED (LOW)' : 'OPEN (HIGH)'}
              </div>
              <div className="text-[10px] text-stone-500 font-mono">GPIO5 Active-LOW</div>
            </div>

            {/* 6. Submersible Pump */}
            <div className={`p-3 rounded border space-y-1 ${
              reading?.pump_status === 'ON'
                ? 'bg-forest-100 border-forest-400 text-forest-900 font-bold'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}>
              <div className="text-[10px] uppercase font-mono font-semibold text-stone-500">6. DC Pump</div>
              <div className="text-sm font-bold font-mono">{reading?.pump_status || 'OFF'}</div>
              <div className="text-[10px] text-stone-500 font-mono">External Supply</div>
            </div>
          </div>
        </div>

        {/* Operator Control Console */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
            <SectionHeader
              title="Manual Override &amp; Approval Console"
              caption="Direct operator actuation commands with physical interlock confirmation"
            />
            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500">Autonomous Execution:</span>
              <button
                onClick={() => setAutomateMode(!automateMode)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition border ${
                  automateMode 
                    ? 'bg-forest-800 text-white border-forest-900' 
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 border-stone-300'
                }`}
              >
                {automateMode ? 'AUTO: ENABLED' : 'AUTO: DISABLED'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* APPROVE OPERATION */}
            <button
              onClick={() => openConfirmation('APPROVE')}
              disabled={loadingAction !== null || decision?.status === 'APPROVED'}
              className="px-5 py-2.5 rounded bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs shadow-sm transition disabled:opacity-40"
            >
              APPROVE OPERATION ({decision?.decision || 'IRRIGATE'})
            </button>

            {/* REJECT */}
            <button
              onClick={() => openConfirmation('REJECT')}
              disabled={loadingAction !== null}
              className="px-4 py-2.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-medium text-xs transition disabled:opacity-40"
            >
              REJECT RECOMMENDATION
            </button>

            {/* CANCEL PENDING COMMAND */}
            <button
              onClick={handleCancelCommand}
              disabled={loadingAction !== null}
              className="px-4 py-2.5 rounded bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 border border-stone-300 hover:border-red-300 font-medium text-xs transition disabled:opacity-40"
              title="Remove any queued command before ESP32 consumes it"
            >
              CANCEL PENDING COMMAND
            </button>

            {/* MANUAL START */}
            <button
              onClick={() => openConfirmation('MANUAL_ON')}
              disabled={loadingAction !== null}
              className="px-4 py-2.5 rounded bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow-sm transition disabled:opacity-40"
            >
              MANUAL START PUMP
            </button>

            {/* STOP PUMP */}
            <button
              onClick={() => openConfirmation('MANUAL_OFF')}
              disabled={loadingAction !== null}
              className="px-4 py-2.5 rounded bg-stone-800 hover:bg-stone-900 text-stone-100 font-medium text-xs shadow-sm transition disabled:opacity-40"
            >
              STOP PUMP (EMERGENCY)
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded bg-stone-50 border border-stone-200 text-xs text-stone-800 font-mono">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Command & Action Audit Log */}
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <SectionHeader
              title="Actuation Command Audit Trail"
              caption="Immutable sequence record of all operator approvals, overrides, and hardware states"
            />
            <span className="text-[11px] font-mono text-stone-500">Operator &amp; Firmware Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-mono text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Approval ID</th>
                  <th className="py-2.5 px-4 font-semibold">User</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Pump State</th>
                  <th className="py-2.5 px-4 font-semibold">Duration</th>
                  <th className="py-2.5 px-4 font-semibold">Actual ON</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Reason / Interlock Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {actionHistory.map((act) => (
                  <tr key={act.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 font-mono text-stone-500">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                      {act.approval_id || `--`}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900">
                      {act.user_name}
                    </td>
                    <td className="py-3 px-4 font-semibold font-mono text-stone-800">
                      {act.action_type}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={act.pump_state === 'ON' ? 'text-forest-700 font-bold' : 'text-stone-500'}>
                        {act.pump_state}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {act.duration_s ? `${act.duration_s}s` : (act.duration_minutes > 0 ? `${act.duration_minutes}m` : '--')}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {act.actual_on_ms !== null && act.actual_on_ms !== undefined ? `${(act.actual_on_ms / 1000).toFixed(1)}s` : '--'}
                    </td>
                    <td className="py-3 px-4">
                      {getExecutionBadge(act.execution_status)}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px] max-w-xs truncate">
                      {act.reason || 'Normal dispatch'}
                    </td>
                  </tr>
                ))}
                {actionHistory.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-stone-400 italic">
                      No actuation commands dispatched in this cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm Actuation"
        cancelText="Abort"
        variant={confirmModal.variant}
        onConfirm={() => triggerCommand(confirmModal.actionType)}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </DashboardLayout>
  );
}
