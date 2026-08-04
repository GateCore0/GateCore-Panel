import React, { useState, useEffect, useCallback } from 'react';
import gatiLogo from './assets/gati.svg';
import { LANGUAGES, translations as globalTranslations, getInitialLanguage, persistLanguage } from './i18n';
import {
  Server, HardDrive, Box, Layers, Cpu, Shield, Users, Folder,
  Terminal, Sun, Moon, Globe, Plus, Trash2, Play, Square, Code, LogOut,
  X, RefreshCw, Edit, Save, Key, Download, Upload, ChevronRight, Eye, Monitor,
  RotateCw, ScrollText, Usb, Activity, Copy
} from 'lucide-react';

type Language = string;
type ActiveTab = 'dashboard' | 'docker' | 'hypervisor' | 'vms' | 'podman' | 'storage' | 'passthrough' | 'files' | 'users' | 'cluster' | 'monitoring';

const translations = {
  de: {
    title: 'GateCore Infrastructure',
    dashboard: 'Dashboard',
    docker: 'Docker & Compose',
    hypervisors: 'Hypervisors',
    virtualMachines: 'VMs / LXC',
    podmanTab: 'Podman',
    storage: 'Speicher Pools & ZFS',
    passthrough: 'Hardware Passthrough',
    files: 'Dateiverwaltung',
    users: 'Benutzer & LDAP',
    cluster: 'Cluster Nodes',
    monitoring: 'Monitoring',
    addHost: 'Hypervisor Hinzufügen',
    addDocker: 'Container Erstellen',
    createZfs: 'ZFS Pool Erstellen',
    status: 'Status',
    online: 'Online',
    offline: 'Offline',
    logout: 'Abmelden',
    login: 'Anmelden',
    username: 'Benutzername',
    password: 'Passwort',
    name: 'Name',
    image: 'Image',
    actions: 'Aktionen',
    create: 'Erstellen',
    delete: 'Löschen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    refresh: 'Aktualisieren',
    loading: 'Laden...',
    noData: 'Keine Daten vorhanden',
    confirm: 'Wirklich löschen?',
    success: 'Erfolgreich',
    error: 'Fehler',
    containers: 'Container',
    compose: 'Compose Projekte',
    volumes: 'Volumes',
    hosts: 'Hosts',
    vms: 'VMs',
    lxc: 'LXC Container',
    podman: 'Podman Container',
    zfsPools: 'ZFS Pools',
    storagePools: 'Speicher Pools',
    role: 'Rolle',
    addUser: 'Benutzer Hinzufügen',
    changePassword: 'Passwort Ändern',
    ldapConfig: 'LDAP Konfiguration',
    addNode: 'Node Hinzufügen',
    endpoint: 'Endpoint',
    apiKey: 'API Key',
    generateKey: 'API-Key generieren',
    generatedKey: 'Generierter API-Key',
    copyKey: 'Key kopieren',
    keyCopied: 'Key kopiert!',
    keyWarning: 'Speichere diesen Key sicher – er wird nur einmal angezeigt!',
    revokeKey: 'Key widerrufen',
    rotateKey: 'Key rotieren',
    revoked: 'Widerrufen',
    pending: 'Ausstehend',
    expiresIn: 'Ablauf (Tage)',
    addVm: 'VM Erstellen',
    addLxc: 'LXC Erstellen',
    addPodman: 'Podman Erstellen',
    addStorage: 'Speicher Pool Erstellen',
    formatDisk: 'Festplatte Formatieren',
    addPassthrough: 'Passthrough Zuweisen',
    shell: 'Shell',
    path: 'Pfad',
    type: 'Typ',
    raidLevel: 'RAID Level',
    disks: 'Festplatten',
    memory: 'Speicher (MB)',
    vcpus: 'vCPUs',
    diskSize: 'Disk Größe (GB)',
    template: 'Template',
    storagePath: 'Speicher Pfad',
    osType: 'OS Typ',
    purpose: 'Zweck',
    ip: 'IP Adresse',
    port: 'Port',
    deviceId: 'Geräte ID',
    description: 'Beschreibung',
    guestType: 'Gast Typ',
    enabled: 'Aktiviert',
    url: 'URL',
    bindDn: 'Bind DN',
    bindPassword: 'Bind Passwort',
    searchBase: 'Search Base',
    userFilter: 'User Filter',
    running: 'Läuft',
    stopped: 'Gestoppt',
    connected: 'Verbunden',
    disconnected: 'Getrennt',
    start: 'Start',
    stop: 'Stopp',
    restart: 'Neustart',
    logs: 'Logs',
    containerLogs: 'Container Logs',
    composeLogs: 'Compose Logs',
    close: 'Schließen',
    edit: 'Bearbeiten',
    editContainer: 'Container Bearbeiten',
    ports: 'Ports',
    addPort: 'Port hinzufügen',
    removePort: 'Port entfernen',
    addVolume: 'Volume hinzufügen',
    removeVolume: 'Volume entfernen',
    hostPort: 'Host Port',
    containerPort: 'Container Port',
    protocol: 'Protokoll',
    hostPath: 'Host Pfad',
    containerPath: 'Container Pfad',
    mode: 'Modus',
    apply: 'Übernehmen',
    pciDevices: 'PCIe Geräte',
    usbDevices: 'USB Geräte',
    detectedHardware: 'Erkannte Hardware',
    selectHost: 'Host auswählen',
    deviceCount: 'Geräte',
    noHardware: 'Keine Hardware erkannt',
    loadHardware: 'Hardware laden',
    selectDevice: 'Gerät auswählen',
    noDevicesFound: 'Keine Geräte gefunden. Bitte zuerst einen Host & Hardware laden.',
    loadDevices: 'Geräte laden',
    selectGuest: 'Gast auswählen',
    noGuestsFound: 'Keine Gäste für diesen Typ gefunden.',
    renameVolume: 'Volume umbenennen',
    newVolumeName: 'Neuer Name',
    rename: 'Umbenennen',
  },
  en: {
    title: 'GateCore Infrastructure',
    dashboard: 'Dashboard',
    docker: 'Docker & Compose',
    hypervisors: 'Hypervisors',
    virtualMachines: 'VMs / LXC',
    podmanTab: 'Podman',
    storage: 'Storage Pools & ZFS',
    passthrough: 'Hardware Passthrough',
    files: 'File Manager',
    users: 'Users & LDAP',
    cluster: 'Cluster Nodes',
    monitoring: 'Monitoring',
    addHost: 'Add Hypervisor',
    addDocker: 'Create Container',
    createZfs: 'Create ZFS Pool',
    status: 'Status',
    online: 'Online',
    offline: 'Offline',
    logout: 'Logout',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    name: 'Name',
    image: 'Image',
    actions: 'Actions',
    create: 'Create',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    refresh: 'Refresh',
    loading: 'Loading...',
    noData: 'No data available',
    confirm: 'Really delete?',
    success: 'Success',
    error: 'Error',
    containers: 'Containers',
    compose: 'Compose Projects',
    volumes: 'Volumes',
    hosts: 'Hosts',
    vms: 'VMs',
    lxc: 'LXC Containers',
    podman: 'Podman Containers',
    zfsPools: 'ZFS Pools',
    storagePools: 'Storage Pools',
    role: 'Role',
    addUser: 'Add User',
    changePassword: 'Change Password',
    ldapConfig: 'LDAP Configuration',
    addNode: 'Add Node',
    endpoint: 'Endpoint',
    apiKey: 'API Key',
    generateKey: 'Generate API Key',
    generatedKey: 'Generated API Key',
    copyKey: 'Copy key',
    keyCopied: 'Key copied!',
    keyWarning: 'Store this key securely – it will only be shown once!',
    revokeKey: 'Revoke key',
    rotateKey: 'Rotate key',
    revoked: 'Revoked',
    pending: 'Pending',
    expiresIn: 'Expiry (days)',
    addVm: 'Create VM',
    addLxc: 'Create LXC',
    addPodman: 'Create Podman',
    addStorage: 'Create Storage Pool',
    formatDisk: 'Format Disk',
    addPassthrough: 'Assign Passthrough',
    shell: 'Shell',
    path: 'Path',
    type: 'Type',
    raidLevel: 'RAID Level',
    disks: 'Disks',
    memory: 'Memory (MB)',
    vcpus: 'vCPUs',
    diskSize: 'Disk Size (GB)',
    template: 'Template',
    storagePath: 'Storage Path',
    osType: 'OS Type',
    purpose: 'Purpose',
    ip: 'IP Address',
    port: 'Port',
    deviceId: 'Device ID',
    description: 'Description',
    guestType: 'Guest Type',
    enabled: 'Enabled',
    url: 'URL',
    bindDn: 'Bind DN',
    bindPassword: 'Bind Password',
    searchBase: 'Search Base',
    userFilter: 'User Filter',
    running: 'Running',
    stopped: 'Stopped',
    connected: 'Connected',
    disconnected: 'Disconnected',
    start: 'Start',
    stop: 'Stop',
    restart: 'Restart',
    logs: 'Logs',
    containerLogs: 'Container Logs',
    composeLogs: 'Compose Logs',
    close: 'Close',
    edit: 'Edit',
    editContainer: 'Edit Container',
    ports: 'Ports',
    addPort: 'Add Port',
    removePort: 'Remove Port',
    addVolume: 'Add Volume',
    removeVolume: 'Remove Volume',
    hostPort: 'Host Port',
    containerPort: 'Container Port',
    protocol: 'Protocol',
    hostPath: 'Host Path',
    containerPath: 'Container Path',
    mode: 'Mode',
    apply: 'Apply',
    pciDevices: 'PCIe Devices',
    usbDevices: 'USB Devices',
    detectedHardware: 'Detected Hardware',
    selectHost: 'Select host',
    deviceCount: 'Devices',
    noHardware: 'No hardware detected',
    loadHardware: 'Load hardware',
    selectDevice: 'Select device',
    noDevicesFound: 'No devices found. Please select a host & load hardware first.',
    loadDevices: 'Load devices',
    selectGuest: 'Select guest',
    noGuestsFound: 'No guests found for this type.',
    renameVolume: 'Rename Volume',
    newVolumeName: 'New name',
    rename: 'Rename',
  }
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('gatecore_token');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function api(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, {
    ...opts,
    credentials: 'include',
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// --- Dark Mode Cookie Helper ---
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

function getInitialDarkMode(): boolean {
  const saved = getCookie('gatecore_darkmode');
  if (saved !== null) return saved === 'true';
  return true; // Standard: Dark Mode
}

function persistDarkMode(dark: boolean) {
  setCookie('gatecore_darkmode', String(dark), 365);
}

function Modal({ open, onClose, title, children, darkMode }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; darkMode: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border shadow-2xl p-6 ${darkMode ? 'bg-gate-darkCard border-gray-700' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-700"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  const color = s.includes('RUN') || s.includes('ON') || s.includes('CONNECT')
    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    : s.includes('STOP') || s.includes('OFF') || s.includes('DISCONNECT')
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.includes('RUN') || s.includes('ON') || s.includes('CONNECT') ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {status}
    </span>
  );
}

function Input({ label, darkMode, ...props }: any) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
      <input
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gate-orange ${
          darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
        }`}
      />
    </div>
  );
}

function Select({ label, darkMode, children, ...props }: any) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
      <select
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gate-orange ${
          darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
        }`}
      >
        {children}
      </select>
    </div>
  );
}

function TextArea({ label, darkMode, ...props }: any) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
      <textarea
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gate-orange ${
          darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
        }`}
      />
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', disabled, className = '' }: any) {
  const base = 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-gate-orange to-gate-purple text-white hover:opacity-90',
    orange: 'bg-gate-orange text-white hover:opacity-90',
    purple: 'bg-gate-purple text-white hover:opacity-90',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'border border-gray-700 hover:bg-gray-800 text-gray-300',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function DataTable({ columns, rows, darkMode, empty }: any) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">{empty || '—'}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {columns.map((c: any) => (
              <th key={c.key} className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, i: number) => (
            <tr key={row.id || i} className={`border-b ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
              {columns.map((c: any) => (
                <td key={c.key} className="px-3 py-2.5">{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Extrahiert die Device-ID aus einem lspci/lsusb Ausgabezeile */
function extractDeviceId(type: string, line: string): string {
  if (type === 'PCIE') {
    // lspci:   "00:1f.2 SATA controller: Intel Corporation ..."
    // Fallback: "0000:00:1f.2 [8086:a102] Class 01 Rev 00"
    const m = line.match(/^(?:[0-9a-fA-F]{4}:)?[0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-9a-fA-F]/);
    if (m) return m[0];
    return line.split(/\s+/)[0];
  }
  // lsusb: "Bus 001 Device 002: ID 8087:8000 Intel Corp."
  // Fallback: "Bus Device ID 8087:8000 Intel Corp."
  const m = line.match(/ID\s+([0-9a-fA-F]{4}:[0-9a-fA-F]{4})/);
  if (m) return m[1];
  return line;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('gatecore_token'));
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [darkMode, setDarkMode] = useState(getInitialDarkMode());
  const [lang, setLang] = useState<Language>(getInitialLanguage());
  const changeLang = (newLang: Language) => {
    setLang(newLang);
    persistLanguage(newLang);
  };

  // Sprache bei jeder Änderung persistieren (zusätzliche Absicherung)
  useEffect(() => {
    persistLanguage(lang);
  }, [lang]);

  // Dark Mode bei jeder Änderung als Cookie persistieren
  useEffect(() => {
    persistDarkMode(darkMode);
  }, [darkMode]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [containers, setContainers] = useState<any[]>([]);
  const [composeProjects, setComposeProjects] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [clusterNodes, setClusterNodes] = useState<any[]>([]);
  const [zfsPools, setZfsPools] = useState<any[]>([]);
  const [storagePools, setStoragePools] = useState<any[]>([]);
  const [passthroughDevices, setPassthroughDevices] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any>({ lxcTemplates: [], isoImages: [] });
  const [files, setFiles] = useState<any[]>([]);
  const [selectedHost, setSelectedHost] = useState('');
  const [disks, setDisks] = useState<any[]>([]);
  const [hardwareDevices, setHardwareDevices] = useState<any>({ pci: [], usb: [] });
  const [hardwareHost, setHardwareHost] = useState('');
  const [dockerHostFilter, setDockerHostFilter] = useState('');
  const [dockerContainers, setDockerContainers] = useState<any[]>([]);
  const [localDockerContainers, setLocalDockerContainers] = useState<any[]>([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [containerMode, setContainerMode] = useState(false);
  const [dockerSource, setDockerSource] = useState(''); // '' = kein Docker-Modus, 'local' = dieser Rechner, hostId = remote
  const [filePath, setFilePath] = useState('/');
  const [fileContent, setFileContent] = useState('');
  const [editingFile, setEditingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [ldapConfig, setLdapConfig] = useState<any>({});
  const [shellContainer, setShellContainer] = useState('');
  const [shellOutput, setShellOutput] = useState('');
  const [shellInput, setShellInput] = useState('');
  const [wsRef, setWsRef] = useState<WebSocket | null>(null);
  const [logsData, setLogsData] = useState('');
  const [logsTitle, setLogsTitle] = useState('');
  const [editContainerId, setEditContainerId] = useState('');
  const [editContainerName, setEditContainerName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editPorts, setEditPorts] = useState<{ host: string; container: string; protocol: string; published: boolean }[]>([]);
  const [editVolumes, setEditVolumes] = useState<{ host: string; container: string; mode: string }[]>([]);
  const [monitorHost, setMonitorHost] = useState('');
  const [monitorMetrics, setMonitorMetrics] = useState<any>(null);
  const [monitorProcesses, setMonitorProcesses] = useState<any[]>([]);
  const [monitorHistory, setMonitorHistory] = useState<any[]>([]);

  // Modal states
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const t = { ...translations.en, ...(translations as Record<string, Record<string, string>>)[lang] || {}, ...(globalTranslations[lang] || {}) } as Record<string, string>;

  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(''), 5000); };
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const setF = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  // Session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/auth/me', { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (!token && data.user) setToken('cookie_active');
        } else if (token) {
          setToken(null); setUser(null); localStorage.removeItem('gatecore_token');
        }
      } catch { /* ignore */ }
      finally { setIsLoadingSession(false); }
    };
    checkSession();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('gatecore_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setLoginError(data.error || 'Login fehlgeschlagen');
      }
    } catch {
      setLoginError('Serververbindung fehlgeschlagen');
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* */ }
    localStorage.removeItem('gatecore_token');
    setToken(null); setUser(null);
  };

  // Data loaders
  const loadDocker = useCallback(async (hostFilter?: string) => {
    try {
      const q = hostFilter ? `?hostId=${encodeURIComponent(hostFilter)}` : '';
      const [c, p, v] = await Promise.all([
        api(`/api/docker/containers${q}`),
        api('/api/docker/compose'),
        api(`/api/docker/volumes${q}`),
      ]);
      setContainers(c); setComposeProjects(p); setVolumes(v);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadHosts = useCallback(async () => {
    try { setHosts(await api('/api/hypervisors')); } catch (e: any) { showError(e.message); }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const [u, l] = await Promise.all([api('/api/users'), api('/api/ldap/config')]);
      setUsers(u); setLdapConfig(l);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadCluster = useCallback(async () => {
    try { setClusterNodes(await api('/api/cluster/nodes')); } catch (e: any) { showError(e.message); }
  }, []);

  const loadStorage = useCallback(async () => {
    try {
      const [z, s] = await Promise.all([api('/api/zfs'), api('/api/storage-pools')]);
      setZfsPools(z); setStoragePools(s);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadPassthrough = useCallback(async () => {
    try { setPassthroughDevices(await api('/api/passthrough')); } catch (e: any) { showError(e.message); }
  }, []);

  const loadDockerContainers = useCallback(async (hostId: string) => {
    try {
      const c = await api(`/api/hosts/${hostId}/docker-containers`);
      setDockerContainers(c);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadLocalDockerContainers = useCallback(async () => {
    try {
      const c = await api(`/api/docker/instances`);
      setLocalDockerContainers(c);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadFiles = useCallback(async (path = filePath, hostId = selectedHost, container = selectedContainer, containerModeOn = containerMode, dockerSourceOn = dockerSource) => {
    try {
      if (hostId === 'local-docker' && containerModeOn && container) {
        // Docker-Container-Dateisystem dieses Rechners (docker exec)
        const q = `?path=${encodeURIComponent(path)}&container=${encodeURIComponent(container)}`;
        const f = await api(`/api/files/docker/container/local${q}`);
        setFiles(f); setFilePath(path);
      } else if (hostId === 'local-docker' && !containerModeOn) {
        // Dateisystem des Docker-Hosts (dieser Rechner) via Agent-Container
        const q = `?path=${encodeURIComponent(path)}`;
        const f = await api(`/api/files/host/local${q}`);
        setFiles(f); setFilePath(path);
      } else if (containerModeOn && container) {
        // Remote-Docker-Container (per SSH)
        const q = `?path=${encodeURIComponent(path)}&hostId=${encodeURIComponent(hostId)}&container=${encodeURIComponent(container)}`;
        const f = await api(`/api/files/docker/container${q}`);
        setFiles(f); setFilePath(path);
      } else {
        // Lokales GateCore-Dateisystem oder Remote-Host-Dateisystem (per SSH)
        const effectiveHost = hostId;
        const q = `?path=${encodeURIComponent(path)}${effectiveHost ? `&hostId=${encodeURIComponent(effectiveHost)}` : ''}`;
        const f = await api(`/api/files/host${q}`);
        setFiles(f); setFilePath(path);
      }
    } catch (e: any) { showError(e.message); }
  }, [filePath, selectedHost, selectedContainer, containerMode, dockerSource]);

  const loadTemplates = useCallback(async () => {
    try { setTemplates(await api('/api/templates')); } catch { /* */ }
  }, []);

  const loadDisks = useCallback(async (hostId: string) => {
    try {
      const d = await api(`/api/hosts/${hostId}/disks`);
      setDisks(d);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadHardware = useCallback(async (hostId: string) => {
    try {
      const hw = await api(`/api/hardware/${hostId}`);
      setHardwareDevices(hw);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadMonitoring = useCallback(async (hostId: string) => {
    try {
      const [m, p, h] = await Promise.all([
        api(`/api/hosts/${hostId}/metrics`),
        api(`/api/hosts/${hostId}/processes?limit=10`),
        api(`/api/hosts/${hostId}/metrics/history?minutes=60`),
      ]);
      setMonitorMetrics(m);
      setMonitorProcesses(p);
      setMonitorHistory(h);
    } catch (e: any) { showError(e.message); }
  }, []);

  const loadDashboard = useCallback(async () => {
    await Promise.all([loadDocker(), loadHosts(), loadStorage(), loadCluster()]);
  }, [loadDocker, loadHosts, loadStorage, loadCluster]);

  useEffect(() => {
    if (!token) return;
    loadTemplates();
    switch (activeTab) {
      case 'dashboard': loadDashboard(); break;
      case 'docker': loadDocker(); loadHosts(); break;
      case 'hypervisor': loadHosts(); break;
      case 'vms': loadHosts(); break;
      case 'podman': loadHosts(); break;
      case 'storage': loadStorage(); loadHosts(); break;
      case 'passthrough': loadPassthrough(); loadHosts(); break;
      case 'files': loadFiles('/'); break;
      case 'users': loadUsers(); break;
      case 'cluster': loadCluster(); break;
      case 'monitoring': loadHosts(); break;
    }
  }, [activeTab, token]);

  // Form submit handlers
  const submitForm = async () => {
    setLoading(true);
    try {
      switch (modal) {
        case 'docker':
          await api('/api/docker/containers', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadDocker();
          break;
        case 'compose':
          await api('/api/docker/compose', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadDocker();
          break;
        case 'volume':
          await api('/api/docker/volumes', { method: 'POST', body: JSON.stringify({ volumeName: form.name }) });
          showSuccess(t.success);
          break;
        case 'hypervisor':
          await api('/api/hypervisors', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadHosts();
          break;
        case 'vm':
          await api('/api/vm', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadHosts();
          break;
        case 'lxc':
          await api('/api/lxc', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadHosts();
          break;
        case 'podman':
          await api('/api/podman', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadHosts();
          break;
        case 'zfs':
          await api('/api/zfs', { method: 'POST', body: JSON.stringify({ ...form, disks: (form.disks || '').split(',').map((d: string) => d.trim()) }) });
          showSuccess(t.success); loadStorage();
          break;
        case 'storage':
          await api('/api/storage-pools', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadStorage();
          break;
        case 'format':
          await api('/api/disks/format', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success);
          break;
        case 'passthrough':
          await api('/api/passthrough', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadPassthrough();
          break;
        case 'user':
          await api('/api/users', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadUsers();
          break;
        case 'password':
          await api(`/api/users/${form.id}/password`, { method: 'PUT', body: JSON.stringify({ password: form.password }) });
          showSuccess(t.success);
          break;
        case 'ldap':
          await api('/api/ldap/config', { method: 'POST', body: JSON.stringify(form) });
          showSuccess(t.success); loadUsers();
          break;
        case 'cluster': {
          const node = await api('/api/cluster/nodes', { method: 'POST', body: JSON.stringify(form) });
          if (node.apiKey) {
            setForm({ ...form, generatedKey: node.apiKey });
            showSuccess(t.generatedKey);
            loadCluster();
            return; // Modal offen lassen, damit der Key angezeigt wird
          }
          showSuccess(t.success); loadCluster();
          break;
        }
      }
      setModal(null); setForm({});
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async (url: string, reload: () => void) => {
    if (!confirm(t.confirm)) return;
    try {
      await api(url, { method: 'DELETE' });
      showSuccess(t.success);
      reload();
    } catch (e: any) { showError(e.message); }
  };

  const openShell = (containerName: string) => {
    setShellContainer(containerName);
    setShellOutput('');
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/docker/shell/${containerName}`);
    ws.onmessage = (ev) => setShellOutput((p) => p + ev.data);
    ws.onerror = () => setShellOutput((p) => p + '\n[Connection error]');
    ws.onclose = () => setShellOutput((p) => p + '\n[Disconnected]');
    setWsRef(ws);
    setModal('shell');
  };

  const sendShell = () => {
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(shellInput + '\n');
      setShellInput('');
    }
  };

  const containerAction = async (r: any, action: string) => {
    try {
      await api(`/api/docker/containers/${r.id}/action`, { method: 'POST', body: JSON.stringify({ action }) });
      showSuccess(t.success);
      loadDocker();
    } catch (e: any) { showError(e.message); }
  };

  const composeAction = async (r: any, action: string) => {
    try {
      await api(`/api/docker/compose/${r.id}/action`, { method: 'POST', body: JSON.stringify({ action }) });
      showSuccess(t.success);
      loadDocker();
    } catch (e: any) { showError(e.message); }
  };

  const showContainerLogs = async (r: any) => {
    try {
      const data = await api(`/api/docker/containers/${r.id}/logs`);
      setLogsTitle(`${t.containerLogs}: ${r.name}`);
      setLogsData(data.logs || '');
      setModal('logs');
    } catch (e: any) { showError(e.message); }
  };

  const showComposeLogs = async (r: any) => {
    try {
      const data = await api(`/api/docker/compose/${r.id}/logs`);
      setLogsTitle(`${t.composeLogs}: ${r.name}`);
      setLogsData(data.logs || '');
      setModal('logs');
    } catch (e: any) { showError(e.message); }
  };

  const openEditContainer = async (r: any) => {
    try {
      const data = await api(`/api/docker/containers/${r.id}/config`);
      setEditContainerId(r.id);
      setEditContainerName(data.name || r.name);
      setEditImage(data.image || '');
      setEditPorts(data.ports || []);
      setEditVolumes(data.volumes || []);
      setModal('editContainer');
    } catch (e: any) { showError(e.message); }
  };

  const addPortRow = () => {
    setEditPorts((p) => [...p, { host: '', container: '', protocol: 'tcp', published: false }]);
  };

  const removePortRow = (idx: number) => {
    setEditPorts((p) => p.filter((_, i) => i !== idx));
  };

  const setPortField = (idx: number, field: string, val: string) => {
    setEditPorts((p) => p.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };

  const addVolumeRow = () => {
    setEditVolumes((v) => [...v, { host: '', container: '', mode: 'rw' }]);
  };

  const removeVolumeRow = (idx: number) => {
    setEditVolumes((v) => v.filter((_, i) => i !== idx));
  };

  const setVolumeField = (idx: number, field: string, val: string) => {
    setEditVolumes((v) => v.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };

  const saveEditContainer = async () => {
    try {
      // Ports setzen (freigeben/blockieren): published=false → nicht publishen (blockiert)
      const portsPayload = editPorts.map((p) => ({ host: p.published ? p.host : 'BLOCKED', container: p.container, protocol: p.protocol }));
      await api(`/api/docker/containers/${editContainerId}/config`, { method: 'PUT', body: JSON.stringify({ action: 'setPorts', ports: portsPayload }) });
      const volumesPayload = editVolumes.map((v) => `${v.host}:${v.container}:${v.mode || 'rw'}`);
      await api(`/api/docker/containers/${editContainerId}/config`, { method: 'PUT', body: JSON.stringify({ action: 'setVolumes', volumes: volumesPayload }) });
      showSuccess(t.success);
      setModal(null);
      loadDocker();
    } catch (e: any) { showError(e.message); }
  };

  const openFile = async (f: any) => {
    if (f.isDirectory) {
      loadFiles(f.path);
    } else {
      try {
        if (selectedHost === 'local-docker' && containerMode && selectedContainer) {
          const data = await api(`/api/files/docker/container/local/read?path=${encodeURIComponent(f.path)}&container=${encodeURIComponent(selectedContainer)}`);
          setSelectedFile(f.path);
          setFileContent(data.content);
          setEditingFile(true);
        } else if (selectedHost === 'local-docker' && !containerMode) {
          const data = await api(`/api/files/host/local/read?path=${encodeURIComponent(f.path)}`);
          setSelectedFile(f.path);
          setFileContent(data.content);
          setEditingFile(true);
        } else if (containerMode && selectedContainer) {
          const data = await api(`/api/files/docker/container/read?path=${encodeURIComponent(f.path)}&hostId=${encodeURIComponent(selectedHost)}&container=${encodeURIComponent(selectedContainer)}`);
          setSelectedFile(f.path);
          setFileContent(data.content);
          setEditingFile(true);
        } else {
          const hostParam = selectedHost ? `&hostId=${encodeURIComponent(selectedHost)}` : '';
          const data = await api(`/api/files/host/read?path=${encodeURIComponent(f.path)}${hostParam}`);
          setSelectedFile(f.path);
          setFileContent(data.content);
          setEditingFile(true);
        }
      } catch (e: any) { showError(e.message); }
    }
  };

  const saveFile = async () => {
    try {
      if (selectedHost === 'local-docker' && containerMode && selectedContainer) {
        await api('/api/files/docker/container/local/save', { method: 'POST', body: JSON.stringify({ path: selectedFile, content: fileContent, container: selectedContainer }) });
      } else if (selectedHost === 'local-docker' && !containerMode) {
        await api('/api/files/host/local/save', { method: 'POST', body: JSON.stringify({ path: selectedFile, content: fileContent }) });
      } else if (containerMode && selectedContainer) {
        await api('/api/files/docker/container/save', { method: 'POST', body: JSON.stringify({ path: selectedFile, content: fileContent, hostId: selectedHost, container: selectedContainer }) });
      } else {
        const hostId = selectedHost || undefined;
        await api('/api/files/host/save', { method: 'POST', body: JSON.stringify({ path: selectedFile, content: fileContent, hostId }) });
      }
      showSuccess(t.success);
      setEditingFile(false);
    } catch (e: any) { showError(e.message); }
  };

  const deleteFile = async (path: string) => {
    if (!confirm(t.confirm)) return;
    try {
      if (selectedHost === 'local-docker' && containerMode && selectedContainer) {
        await api(`/api/files/docker/container/local?path=${encodeURIComponent(path)}&container=${encodeURIComponent(selectedContainer)}`, { method: 'DELETE' });
      } else if (selectedHost === 'local-docker' && !containerMode) {
        await api(`/api/files/host/local?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
      } else if (containerMode && selectedContainer) {
        await api(`/api/files/docker/container?path=${encodeURIComponent(path)}&hostId=${encodeURIComponent(selectedHost)}&container=${encodeURIComponent(selectedContainer)}`, { method: 'DELETE' });
      } else {
        const hostParam = selectedHost ? `&hostId=${encodeURIComponent(selectedHost)}` : '';
        await api(`/api/files/host?path=${encodeURIComponent(path)}${hostParam}`, { method: 'DELETE' });
      }
      showSuccess(t.success);
      loadFiles(filePath);
    } catch (e: any) { showError(e.message); }
  };

  const handleHostChange = (hostId: string) => {
    setSelectedHost(hostId);
    setSelectedContainer('');
    setContainerMode(false);
    setDockerContainers([]);
    setFilePath('/');
    setEditingFile(false);

    if (hostId === 'local-docker') {
      // Docker-Container des verbundenen Docker-Daemons laden (docker.sock)
      loadLocalDockerContainers();
      loadFiles('/', 'local-docker', '', false);
    } else if (hostId) {
      // Docker-Container für diesen Remote-Host laden (falls Docker-Capability vorhanden)
      loadDockerContainers(hostId);
      loadFiles('/', hostId, '', false);
    } else {
      loadFiles('/', '', '', false);
    }
  };

  const handleContainerChange = (container: string) => {
    setSelectedContainer(container);
    setFilePath('/');
    setEditingFile(false);
    if (container) {
      setContainerMode(true);
      loadFiles('/', selectedHost, container, true);
    } else {
      setContainerMode(false);
      loadFiles('/', selectedHost, '', false);
    }
  };

  // Counts for dashboard
  const totalVms = hosts.reduce((a, h) => a + (h.vms?.length || 0), 0);
  const totalLxc = hosts.reduce((a, h) => a + (h.lxcContainers?.length || 0), 0);
  const totalPodman = hosts.reduce((a, h) => a + (h.podmanContainers?.length || 0), 0);

  // Login screen
  if (isLoadingSession) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gate-darkBg text-white' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gate-orange" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gate-darkBg text-white' : 'bg-gray-100 text-gray-900'}`}>
        <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl ${darkMode ? 'bg-gate-darkCard border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col items-center mb-8">
            <img src={gatiLogo} alt="GateCore Logo" className="w-20 h-20 mb-3" />
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-gate-orange to-gate-purple bg-clip-text text-transparent">GateCore Manager</h1>
            <p className="text-sm text-gray-400 mt-1">Enterprise Infrastructure Platform</p>
          </div>
          {loginError && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label={t.username} darkMode={darkMode} type="text" required value={usernameInput} onChange={(e: any) => setUsernameInput(e.target.value)} placeholder="admin" />
            <Input label={t.password} darkMode={darkMode} type="password" required value={passwordInput} onChange={(e: any) => setPasswordInput(e.target.value)} placeholder="••••••••" />
            <button type="submit" className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-gate-orange to-gate-purple hover:opacity-90 transition shadow-lg mt-2">{t.login}</button>
          </form>
          <div className="mt-6 flex justify-between items-center text-xs text-gray-400 border-t border-gray-800 pt-4">
            <button onClick={() => setDarkMode(!darkMode)} className="hover:text-white transition">{darkMode ? '☀️ Light' : '🌙 Dark'}</button>
            <select value={lang} onChange={(e) => changeLang(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold border border-gray-700 rounded px-1 py-0.5 cursor-pointer">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const cardClass = `p-5 rounded-xl border ${darkMode ? 'bg-gate-darkCard border-gray-800' : 'bg-white border-gray-200'} shadow-sm`;

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gate-darkBg text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 ${darkMode ? 'bg-gate-darkSidebar border-gray-800' : 'bg-white border-gray-200'}`}>
        <div>
          <div className="p-4 border-b border-gray-800 flex items-center gap-3">
            <img src={gatiLogo} alt="GateCore Logo" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-gate-orange to-gate-purple bg-clip-text text-transparent">GateCore</h1>
              <span className="text-xs text-gray-400">Enterprise v1.0</span>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: t.dashboard, icon: Server },
              { id: 'docker', label: t.docker, icon: Box },
              { id: 'hypervisor', label: t.hypervisors, icon: Cpu },
              { id: 'vms', label: t.virtualMachines, icon: Monitor },
              { id: 'podman', label: t.podmanTab, icon: Layers },
              { id: 'storage', label: t.storage, icon: HardDrive },
              { id: 'passthrough', label: t.passthrough, icon: Layers },
              { id: 'files', label: t.files, icon: Folder },
              { id: 'users', label: t.users, icon: Users },
              { id: 'cluster', label: t.cluster, icon: Shield },
              { id: 'monitoring', label: t.monitoring, icon: Activity },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isActive ? 'bg-gradient-to-r from-gate-orange to-gate-purple text-white shadow-md'
                      : darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <Icon className="w-4 h-4" />{item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-800 flex items-center justify-between">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition">
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gate-purple" />}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5" />
            <select value={lang} onChange={(e) => changeLang(e.target.value as Language)}
              className="bg-transparent cursor-pointer">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 ${darkMode ? 'bg-gate-darkSidebar border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-bold">
            {{
              dashboard: t.dashboard,
              docker: t.docker,
              hypervisor: t.hypervisors,
              vms: t.virtualMachines,
              podman: t.podmanTab,
              storage: t.storage,
              passthrough: t.passthrough,
              files: t.files,
              users: t.users,
              cluster: t.cluster,
              monitoring: t.monitoring,
            }[activeTab]}
          </h2>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Cluster Active
            </span>
            {user && (
              <div className="flex items-center gap-3 border-l border-gray-700 pl-4">
                <span className="text-sm font-semibold">{user.username} ({user.role})</span>
                <button onClick={handleLogout} title={t.logout} className="p-1.5 rounded-lg border border-gray-700 hover:bg-red-500/20 hover:text-red-400 transition">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Alerts */}
        {error && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        {success && <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}

        <div className="p-6 flex-1 overflow-y-auto">

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: t.containers, count: `${containers.length}`, sub: containers.filter(c => c.status === 'RUNNING').length + ' ' + t.running, icon: Box, color: 'from-orange-500 to-amber-500' },
                  { title: t.hosts, count: `${hosts.length}`, sub: hosts.filter(h => h.status === 'ONLINE').length + ' ' + t.online, icon: Cpu, color: 'from-purple-500 to-indigo-500' },
                  { title: t.zfsPools, count: `${zfsPools.length}`, sub: storagePools.length + ' ' + t.storagePools, icon: HardDrive, color: 'from-emerald-500 to-teal-500' },
                  { title: 'VMs / LXC / Podman', count: `${totalVms + totalLxc + totalPodman}`, sub: `${totalVms} VM · ${totalLxc} LXC · ${totalPodman} Podman`, icon: Layers, color: 'from-pink-500 to-rose-500' },
                ].map((card, i) => {
                  const CardIcon = card.icon;
                  return (
                    <div key={i} className={cardClass}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{card.title}</p>
                          <p className="text-2xl font-bold mt-1">{card.count}</p>
                          <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                        </div>
                        <div className={`p-3 rounded-lg bg-gradient-to-tr ${card.color} text-white`}><CardIcon className="w-5 h-5" /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={cardClass}>
                  <h3 className="font-semibold mb-3">{t.containers}</h3>
                  <DataTable darkMode={darkMode} empty={t.noData} columns={[
                    { key: 'name', label: t.name },
                    { key: 'image', label: t.image },
                    { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                  ]} rows={containers.slice(0, 5)} />
                </div>
                <div className={cardClass}>
                  <h3 className="font-semibold mb-3">{t.hosts}</h3>
                  <DataTable darkMode={darkMode} empty={t.noData} columns={[
                    { key: 'name', label: t.name },
                    { key: 'ip', label: t.ip },
                    { key: 'osType', label: t.osType },
                    { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                  ]} rows={hosts.slice(0, 5)} />
                </div>
              </div>
            </div>
          )}

          {/* ===== DOCKER ===== */}
          {activeTab === 'docker' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.docker}</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={dockerHostFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDockerHostFilter(v);
                      loadDocker(v || undefined);
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gate-orange ${
                      darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">{lang === 'de' ? 'Alle Hosts' : 'All hosts'}</option>
                    {hosts.filter((h) => !h.isLocal).map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
                  </select>
                  <Btn onClick={() => { setForm({}); setModal('docker'); }} variant="orange"><Plus className="w-4 h-4" />Docker Container</Btn>
                  <Btn onClick={() => { setForm({ content: 'version: "3"\nservices:\n  app:\n    image: nginx\n    ports:\n      - "8080:80"\n' }); setModal('compose'); }} variant="purple"><Code className="w-4 h-4" />Docker Compose</Btn>
                  <Btn onClick={() => { setForm({}); setModal('volume'); }} variant="ghost"><HardDrive className="w-4 h-4" />Volume</Btn>
                  <Btn onClick={() => loadDocker(dockerHostFilter || undefined)} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>
              <div className={cardClass}>
                <h4 className="font-semibold mb-3">{t.containers}</h4>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'name', label: t.name },
                  { key: 'image', label: t.image },
                  { key: 'host', label: 'Host', render: (r: any) => r.host?.name || r.hostId || (lang === 'de' ? 'Dieser Rechner' : 'This machine') },
                  { key: 'volumeName', label: 'Volume', render: (r: any) => r.volumeName || '—' },
                  { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                  { key: 'actions', label: t.actions, render: (r: any) => (
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEditContainer(r)} className="p-1.5 rounded hover:bg-gate-purple/20 text-gate-purple" title={t.edit}><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => containerAction(r, 'start')} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title={t.start}><Play className="w-3.5 h-3.5" /></button>
                      <button onClick={() => containerAction(r, 'stop')} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title={t.stop}><Square className="w-3.5 h-3.5" /></button>
                      <button onClick={() => containerAction(r, 'restart')} className="p-1.5 rounded hover:bg-gate-orange/20 text-gate-orange" title={t.restart}><RotateCw className="w-3.5 h-3.5" /></button>
                      <button onClick={() => showContainerLogs(r)} className="p-1.5 rounded hover:bg-gate-purple/20 text-gate-purple" title={t.logs}><ScrollText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openShell(r.name)} className="p-1.5 rounded hover:bg-gate-orange/20 text-gate-orange" title={t.shell}><Terminal className="w-3.5 h-3.5" /></button>
                      <button onClick={() => doDelete(`/api/docker/containers/${r.id}`, loadDocker)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title={t.delete}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )},
                ]} rows={containers} />
              </div>
              <div className={cardClass}>
                <h4 className="font-semibold mb-3">{t.compose}</h4>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'name', label: t.name },
                  { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                  { key: 'createdAt', label: 'Created', render: (r: any) => new Date(r.createdAt).toLocaleString() },
                  { key: 'actions', label: t.actions, render: (r: any) => (
                    <div className="flex gap-1">
                      <button onClick={() => composeAction(r, 'start')} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title={t.start}><Play className="w-3.5 h-3.5" /></button>
                      <button onClick={() => composeAction(r, 'stop')} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title={t.stop}><Square className="w-3.5 h-3.5" /></button>
                      <button onClick={() => composeAction(r, 'restart')} className="p-1.5 rounded hover:bg-gate-orange/20 text-gate-orange" title={t.restart}><RotateCw className="w-3.5 h-3.5" /></button>
                      <button onClick={() => showComposeLogs(r)} className="p-1.5 rounded hover:bg-gate-purple/20 text-gate-purple" title={t.logs}><ScrollText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => doDelete(`/api/docker/compose/${r.id}`, loadDocker)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )},
                ]} rows={composeProjects} />
              </div>
              <div className={cardClass}>
                <h4 className="font-semibold mb-3 flex items-center gap-2"><HardDrive className="w-4 h-4 text-gate-purple" />{t.volumes} ({volumes.length})</h4>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'name', label: t.name, render: (r: any) => (
                    <span className="flex items-center gap-2"><HardDrive className="w-3.5 h-3.5 text-gate-purple" />{r.name}</span>
                  )},
                  { key: 'path', label: t.path, render: (r: any) => r.path ? <span className="font-mono text-xs">{r.path}</span> : <span className="text-gray-500">—</span> },
                  { key: 'type', label: t.type, render: (r: any) => r.isPool ? 'Storage Pool' : 'Docker' },
                  { key: 'actions', label: t.actions, render: (r: any) => (
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ name: r.name }); setModal('renameVolume'); }} className="p-1.5 rounded hover:bg-gate-orange/20 text-gate-orange" title={t.renameVolume}><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => {
                        if (!confirm(t.confirm)) return;
                        api(`/api/docker/volumes/${encodeURIComponent(r.name)}?hostId=${encodeURIComponent(dockerHostFilter || '')}`, { method: 'DELETE' })
                          .then(() => { showSuccess(t.success); loadDocker(dockerHostFilter || undefined); })
                          .catch((e: any) => showError(e.message));
                      }} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title={t.delete}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )},
                ]} rows={volumes} />
              </div>
            </div>
          )}

          {/* ===== HYPERVISOR (Hosts only) ===== */}
          {activeTab === 'hypervisor' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.hypervisors}</h3>
                <div className="flex gap-2 flex-wrap">
                  <Btn onClick={() => { setForm({ port: 22, username: 'root', osType: 'debian', purpose: 'ALL_IN_ONE' }); setModal('hypervisor'); }}><Plus className="w-4 h-4" />{t.addHost}</Btn>
                  <Btn onClick={loadHosts} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>
              <div className={cardClass}>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'name', label: t.name, render: (r: any) => (
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-gate-purple" />
                      <span className="font-medium">{r.name}</span>
                    </div>
                  )},
                  { key: 'ip', label: t.ip, render: (r: any) => <span className="font-mono text-xs">{r.ip}:{r.port}</span> },
                  { key: 'osType', label: t.osType },
                  { key: 'username', label: t.username },
                  { key: 'guests', label: 'Guests', render: (r: any) => (
                    <span className="text-xs text-gray-400">
                      {(r.vms?.length || 0)} VM · {(r.lxcContainers?.length || 0)} LXC · {(r.podmanContainers?.length || 0)} Podman
                    </span>
                  )},
                  { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                  { key: 'actions', label: t.actions, render: (r: any) => (
                    <button onClick={() => doDelete(`/api/hypervisors/${r.id}`, loadHosts)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title={t.delete}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )},
                ]} rows={hosts} />
              </div>
            </div>
          )}

          {/* ===== VMs / LXC / PODMAN ===== */}
          {activeTab === 'vms' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.virtualMachines}</h3>
                <div className="flex gap-2 flex-wrap">
                  <Btn onClick={() => { setForm({ vcpus: 2, memoryMB: 2048, diskSizeGB: 20, storagePath: '/var/lib/libvirt/images' }); setModal('vm'); }} variant="orange"><Plus className="w-4 h-4" />{t.addVm}</Btn>
                  <Btn onClick={() => { setForm({ memoryMB: 512, storagePath: '/var/lib/lxc', template: 'debian' }); setModal('lxc'); }} variant="purple"><Plus className="w-4 h-4" />{t.addLxc}</Btn>
                  <Btn onClick={loadHosts} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>

              {hosts.length === 0 && (
                <div className={cardClass}>
                  <p className="text-sm text-gray-500 text-center py-8">
                    {lang === 'de'
                      ? 'Kein Hypervisor vorhanden. Bitte zuerst unter „Hypervisors“ einen Host hinzufügen.'
                      : 'No hypervisor available. Please add a host under “Hypervisors” first.'}
                  </p>
                </div>
              )}

              {hosts.map((host) => (
                <div key={host.id} className={cardClass}>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
                    <Cpu className="w-5 h-5 text-gate-purple" />
                    <div>
                      <h4 className="font-semibold">{host.name}</h4>
                      <p className="text-xs text-gray-400">{host.ip}:{host.port} · {host.osType}</p>
                    </div>
                    <StatusBadge status={host.status} />
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5" />{t.vms}
                    </p>
                    <DataTable darkMode={darkMode} empty={t.noData} columns={[
                      { key: 'name', label: t.name },
                      { key: 'vcpus', label: t.vcpus },
                      { key: 'memoryMB', label: t.memory },
                      { key: 'diskSizeGB', label: t.diskSize },
                      { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                      { key: 'actions', label: t.actions, render: (r: any) => (
                        <button onClick={() => doDelete(`/api/vm/${r.id}`, loadHosts)} className="p-1 rounded hover:bg-red-500/20 text-red-400" title={t.delete}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )},
                    ]} rows={host.vms || []} />
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <Box className="w-3.5 h-3.5" />{t.lxc}
                    </p>
                    <DataTable darkMode={darkMode} empty={t.noData} columns={[
                      { key: 'name', label: t.name },
                      { key: 'template', label: t.template },
                      { key: 'memoryMB', label: t.memory },
                      { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                      { key: 'actions', label: t.actions, render: (r: any) => (
                        <button onClick={() => doDelete(`/api/lxc/${r.id}`, loadHosts)} className="p-1 rounded hover:bg-red-500/20 text-red-400" title={t.delete}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )},
                    ]} rows={host.lxcContainers || []} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== PODMAN ===== */}
          {activeTab === 'podman' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.podmanTab}</h3>
                <div className="flex gap-2 flex-wrap">
                  <Btn onClick={() => { setForm({}); setModal('podman'); }}><Plus className="w-4 h-4" />{t.addPodman}</Btn>
                  <Btn onClick={loadHosts} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>

              {hosts.length === 0 && (
                <div className={cardClass}>
                  <p className="text-sm text-gray-500 text-center py-8">
                    {lang === 'de'
                      ? 'Kein Hypervisor vorhanden. Bitte zuerst unter „Hypervisors“ einen Host hinzufügen.'
                      : 'No hypervisor available. Please add a host under “Hypervisors” first.'}
                  </p>
                </div>
              )}

              {hosts.map((host) => (
                <div key={host.id} className={cardClass}>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
                    <Layers className="w-5 h-5 text-gate-purple" />
                    <div>
                      <h4 className="font-semibold">{host.name}</h4>
                      <p className="text-xs text-gray-400">{host.ip}:{host.port} · {host.osType}</p>
                    </div>
                    <StatusBadge status={host.status} />
                  </div>
                  <DataTable darkMode={darkMode} empty={t.noData} columns={[
                    { key: 'name', label: t.name },
                    { key: 'image', label: t.image },
                    { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.status} /> },
                    { key: 'actions', label: t.actions, render: (r: any) => (
                      <button onClick={() => doDelete(`/api/podman/${r.id}`, loadHosts)} className="p-1 rounded hover:bg-red-500/20 text-red-400" title={t.delete}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )},
                  ]} rows={host.podmanContainers || []} />
                </div>
              ))}
            </div>
          )}

          {/* ===== STORAGE ===== */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.storage}</h3>
                <div className="flex gap-2 flex-wrap">
                  <Btn onClick={() => { const h = hosts[0]; setForm({ raidLevel: 'mirror', hostId: h?.id || '' }); setModal('zfs'); if (h) loadDisks(h.id); }}><Plus className="w-4 h-4" />{t.createZfs}</Btn>
                  <Btn onClick={() => { setForm({ type: 'ISO' }); setModal('storage'); }} variant="orange"><Plus className="w-4 h-4" />{t.addStorage}</Btn>
                  <Btn onClick={() => { const h = hosts[0]; setForm({ fsType: 'ext4', hostId: h?.id || '' }); setModal('format'); if (h) loadDisks(h.id); }} variant="ghost"><HardDrive className="w-4 h-4" />{t.formatDisk}</Btn>
                  <Btn onClick={loadStorage} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>
              <div className={cardClass}>
                <h4 className="font-semibold mb-3">{t.zfsPools}</h4>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'name', label: t.name },
                  { key: 'raidLevel', label: t.raidLevel },
                  { key: 'disks', label: t.disks, render: (r: any) => (r.disks || []).join(', ') },
                  { key: 'host', label: 'Host', render: (r: any) => r.host?.name || r.hostId },
                  { key: 'actions', label: t.actions, render: (r: any) => <button onClick={() => doDelete(`/api/zfs/${r.id}`, loadStorage)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button> },
                ]} rows={zfsPools} />
              </div>
              <div className={cardClass}>
                <h4 className="font-semibold mb-3">{t.storagePools}</h4>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'name', label: t.name },
                  { key: 'type', label: t.type },
                  { key: 'path', label: t.path },
                  { key: 'host', label: 'Host', render: (r: any) => r.host?.name || r.hostId },
                  { key: 'actions', label: t.actions, render: (r: any) => <button onClick={() => doDelete(`/api/storage-pools/${r.id}`, loadStorage)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button> },
                ]} rows={storagePools} />
              </div>
            </div>
          )}

          {/* ===== PASSTHROUGH ===== */}
          {activeTab === 'passthrough' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.passthrough}</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  <Btn onClick={() => { setForm({ type: 'PCIE', guestType: 'VM' }); setModal('passthrough'); }}><Plus className="w-4 h-4" />{t.addPassthrough}</Btn>
                  <Btn onClick={loadPassthrough} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>

              {/* Erkannte Hardware (USB & PCIe) */}
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
                  <Cpu className="w-5 h-5 text-gate-purple" />
                  <div>
                    <h4 className="font-semibold">{t.detectedHardware} ({hardwareDevices.pci.length + hardwareDevices.usb.length} {t.deviceCount.toLowerCase()})</h4>
                    <p className="text-xs text-gray-400">{t.selectHost}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <select
                    value={hardwareHost}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHardwareHost(v);
                      if (v) loadHardware(v);
                      else setHardwareDevices({ pci: [], usb: [] });
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gate-orange ${
                      darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">— {t.selectHost} —</option>
                    {hosts.map((h: any) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
                  </select>
                  <Btn onClick={() => hardwareHost && loadHardware(hardwareHost)} variant="ghost"><RefreshCw className="w-4 h-4" />{t.loadHardware}</Btn>
                </div>

                {hardwareHost && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5" />{t.pciDevices} ({hardwareDevices.pci.length})
                      </h5>
                      <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {hardwareDevices.pci.length === 0 ? (
                          <p className="text-sm text-gray-500 py-6 text-center">{t.noHardware}</p>
                        ) : (
                          <div className="max-h-72 overflow-y-auto">
                            {hardwareDevices.pci.map((dev: string, i: number) => (
                              <div key={i} className={`px-3 py-2 text-xs font-mono border-b ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>{dev}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Usb className="w-3.5 h-3.5" />{t.usbDevices} ({hardwareDevices.usb.length})
                      </h5>
                      <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {hardwareDevices.usb.length === 0 ? (
                          <p className="text-sm text-gray-500 py-6 text-center">{t.noHardware}</p>
                        ) : (
                          <div className="max-h-72 overflow-y-auto">
                            {hardwareDevices.usb.map((dev: string, i: number) => (
                              <div key={i} className={`px-3 py-2 text-xs font-mono border-b ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>{dev}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Zugewiesene Passthrough-Geräte */}
              <div className={cardClass}>
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-gate-purple" />{t.addPassthrough}</h4>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'type', label: t.type },
                  { key: 'deviceId', label: t.deviceId },
                  { key: 'description', label: t.description },
                  { key: 'guestType', label: t.guestType },
                  { key: 'guestId', label: 'Guest ID' },
                  { key: 'host', label: 'Host', render: (r: any) => r.host?.name || r.hostId },
                  { key: 'actions', label: t.actions, render: (r: any) => <button onClick={() => doDelete(`/api/passthrough/${r.id}`, loadPassthrough)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button> },
                ]} rows={passthroughDevices} />
              </div>
            </div>
          )}

          {/* ===== FILES ===== */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.files}</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedHost}
                    onChange={(e) => handleHostChange(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gate-orange ${
                      darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">{lang === 'de' ? 'Lokales System' : 'Local System'}</option>
                    <option value="local-docker">🐳 Docker (dieser Rechner)</option>
                    {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
                  </select>
                  {(selectedHost === 'local-docker' ? localDockerContainers : dockerContainers).length > 0 && (
                    <select
                      value={selectedContainer}
                      onChange={(e) => handleContainerChange(e.target.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gate-orange ${
                        darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{lang === 'de' ? 'Host-Verzeichnis' : 'Host Directory'}</option>
                      {(selectedHost === 'local-docker' ? localDockerContainers : dockerContainers).map((c) => <option key={c.name} value={c.name}>📦 {c.name} ({c.image})</option>)}
                    </select>
                  )}
                  <span className="text-xs text-gray-400 font-mono">{filePath}</span>
                  <Btn onClick={() => loadFiles(filePath)} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                  {filePath !== '/' && (
                    <Btn onClick={() => {
                      const parent = filePath.replace(/\/[^/]+\/?$/, '') || '/';
                      loadFiles(parent);
                    }} variant="ghost">↑ Up</Btn>
                  )}
                </div>
              </div>
              {editingFile ? (
                <div className={cardClass}>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-mono text-gray-400">{selectedFile}</p>
                    <div className="flex gap-2">
                      <Btn onClick={saveFile} variant="orange"><Save className="w-4 h-4" />{t.save}</Btn>
                      <Btn onClick={() => setEditingFile(false)} variant="ghost">{t.cancel}</Btn>
                    </div>
                  </div>
                  <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} rows={20}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gate-orange ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`} />
                </div>
              ) : (
                <div className={cardClass}>
                  <DataTable darkMode={darkMode} empty={t.noData} columns={[
                    { key: 'name', label: t.name, render: (r: any) => (
                      <button onClick={() => openFile(r)} className="flex items-center gap-2 hover:text-gate-orange">
                        {r.isDirectory ? <Folder className="w-4 h-4 text-gate-purple" /> : <Edit className="w-4 h-4 text-gray-400" />}
                        {r.name}
                      </button>
                    )},
                    { key: 'type', label: t.type, render: (r: any) => r.isDirectory ? 'DIR' : 'FILE' },
                    { key: 'actions', label: t.actions, render: (r: any) => (
                      <button onClick={() => deleteFile(r.path)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    )},
                  ]} rows={files} />
                </div>
              )}
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.users}</h3>
                <div className="flex gap-2">
                  <Btn onClick={() => { setForm({ role: 'USER' }); setModal('user'); }}><Plus className="w-4 h-4" />{t.addUser}</Btn>
                  <Btn onClick={() => { setForm({ ...ldapConfig }); setModal('ldap'); }} variant="purple"><Key className="w-4 h-4" />{t.ldapConfig}</Btn>
                  <Btn onClick={loadUsers} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>
              <div className={cardClass}>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'username', label: t.username },
                  { key: 'role', label: t.role },
                  { key: 'isLdap', label: 'LDAP', render: (r: any) => r.isLdap ? '✓' : '—' },
                  { key: 'actions', label: t.actions, render: (r: any) => (
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ id: r.id }); setModal('password'); }} className="p-1.5 rounded hover:bg-gate-orange/20 text-gate-orange" title={t.changePassword}><Key className="w-3.5 h-3.5" /></button>
                      <button onClick={() => doDelete(`/api/users/${r.id}`, loadUsers)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )},
                ]} rows={users} />
              </div>
            </div>
          )}

          {/* ===== CLUSTER ===== */}
          {activeTab === 'cluster' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.cluster}</h3>
                <div className="flex gap-2">
                  <Btn onClick={() => { setForm({}); setModal('cluster'); }}><Plus className="w-4 h-4" />{t.addNode}</Btn>
                  <Btn onClick={loadCluster} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>
              <div className={cardClass}>
                <DataTable darkMode={darkMode} empty={t.noData} columns={[
                  { key: 'name', label: t.name },
                  { key: 'endpoint', label: t.endpoint },
                  { key: 'apiKey', label: t.apiKey, render: (r: any) => <span className={`font-mono text-xs ${r.revoked ? 'text-red-400 line-through' : ''}`}>{r.apiKeyPreview || '—'}</span> },
                  { key: 'status', label: t.status, render: (r: any) => <StatusBadge status={r.revoked ? t.revoked : r.status} /> },
                  { key: 'actions', label: t.actions, render: (r: any) => (
                    <div className="flex gap-1">
                      <button onClick={async () => { if (!confirm(t.confirm)) return; await api(`/api/cluster/nodes/${r.id}/rotate-key`, { method: 'POST' }).then((d: any) => { alert(`${t.generatedKey}:\n\n${d.apiKey}\n\n${t.keyWarning}`); loadCluster(); }).catch((e: any) => showError(e.message)); }} className="p-1.5 rounded hover:bg-gate-orange/20 text-gate-orange" title={t.rotateKey}><RotateCw className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (!confirm(t.confirm)) return; await api(`/api/cluster/nodes/${r.id}/revoke`, { method: 'POST' }).then(() => { showSuccess(t.success); loadCluster(); }).catch((e: any) => showError(e.message)); }} className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400" title={t.revokeKey}><Key className="w-3.5 h-3.5" /></button>
                      <button onClick={() => doDelete(`/api/cluster/nodes/${r.id}`, loadCluster)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )},
                ]} rows={clusterNodes} />
              </div>
            </div>
          )}

          {/* ===== MONITORING ===== */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold">{t.monitoring}</h3>
                <div className="flex gap-2">
                  <select
                    value={monitorHost}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMonitorHost(v);
                      if (v) loadMonitoring(v);
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gate-orange ${
                      darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">— {t.selectHost} —</option>
                    {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
                  </select>
                  <Btn onClick={() => monitorHost && loadMonitoring(monitorHost)} variant="ghost"><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>

              {!monitorHost && (
                <div className={cardClass}>
                  <p className="text-sm text-gray-500 text-center py-8">
                    {lang === 'de' ? 'Bitte zuerst einen Host auswählen.' : 'Please select a host first.'}
                  </p>
                </div>
              )}

              {monitorHost && monitorMetrics && (() => {
                const fmtBytes = (b: number) => {
                  if (b >= 1e12) return `${(b / 1e12).toFixed(1)} TB`;
                  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
                  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
                  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
                  return `${b} B`;
                };
                const cpuPct = monitorMetrics.cpu?.usagePercent ?? 0;
                const ramUsed = monitorMetrics.memory?.usedGB ?? 0;
                const ramTotal = monitorMetrics.memory?.totalGB ?? 0;
                const ramPct = monitorMetrics.memory?.usedPercent ?? 0;
                const disks = monitorMetrics.disks || [];
                const diskUsed = disks.reduce((a: number, d: any) => a + (d.usedGB || 0), 0);
                const diskTotal = disks.reduce((a: number, d: any) => a + (d.totalGB || 0), 0);
                const netIfaces = monitorMetrics.network || [];
                const netRx = netIfaces.reduce((a: number, n: any) => a + (n.rxBytes || 0), 0);
                const netTx = netIfaces.reduce((a: number, n: any) => a + (n.txBytes || 0), 0);
                const uptime = monitorMetrics.uptime || {};
                const uptimeStr = `${uptime.days || 0}d ${uptime.hours || 0}h ${uptime.minutes || 0}m`;

                return (
                <>
                  {/* Host-Info */}
                  <div className={`${cardClass} flex flex-wrap items-center gap-4 text-sm`}>
                    <span className="font-semibold">{monitorMetrics.hostname || '—'}</span>
                    <span className="text-gray-400">{monitorMetrics.os?.name || ''}</span>
                    <span className="text-gray-500">Uptime: {uptimeStr}</span>
                    <span className="text-gray-500">{monitorMetrics.cpu?.cores || '?'} Cores · Load: {(monitorMetrics.cpu?.loadAvg || []).map((l: number) => l.toFixed(2)).join(' / ')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { title: 'CPU', value: `${cpuPct}%`, sub: `${monitorMetrics.cpu?.cores || '?'} Cores`, icon: Cpu, color: 'from-orange-500 to-amber-500', pct: cpuPct },
                      { title: 'RAM', value: `${ramUsed} / ${ramTotal} GB`, sub: `${ramPct}%`, icon: Box, color: 'from-purple-500 to-indigo-500', pct: ramPct },
                      { title: 'Disk', value: `${diskUsed.toFixed(1)} / ${diskTotal.toFixed(1)} GB`, sub: diskTotal > 0 ? `${Math.round((diskUsed / diskTotal) * 100)}%` : '0%', icon: HardDrive, color: 'from-emerald-500 to-teal-500', pct: diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0 },
                      { title: 'Network', value: `▼ ${fmtBytes(netRx)}`, sub: `▲ ${fmtBytes(netTx)}`, icon: Activity, color: 'from-pink-500 to-rose-500', pct: 0 },
                    ].map((card, i) => {
                      const CardIcon = card.icon;
                      return (
                        <div key={i} className={cardClass}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs text-gray-400 font-medium">{card.title}</p>
                              <p className="text-lg font-bold mt-1">{card.value}</p>
                              {card.sub && <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>}
                            </div>
                            <div className={`p-3 rounded-lg bg-gradient-to-tr ${card.color} text-white`}><CardIcon className="w-5 h-5" /></div>
                          </div>
                          {card.pct > 0 && (
                            <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
                                style={{ width: `${Math.min(card.pct, 100)}%` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Disks detail */}
                  {disks.length > 0 && (
                    <div className={cardClass}>
                      <h4 className="font-semibold mb-3">{lang === 'de' ? 'Festplatten' : 'Disks'}</h4>
                      <div className="space-y-3">
                        {disks.map((d: any, i: number) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span className="font-mono">{d.mount}</span>
                              <span>{d.usedGB} / {d.totalGB} GB ({d.usedPercent}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                              <div className={`h-full rounded-full ${d.usedPercent > 90 ? 'bg-red-500' : d.usedPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(d.usedPercent, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={cardClass}>
                      <h4 className="font-semibold mb-3">{lang === 'de' ? 'Top Prozesse' : 'Top Processes'}</h4>
                      <DataTable darkMode={darkMode} empty={t.noData} columns={[
                        { key: 'pid', label: 'PID', render: (r: any) => <span className="font-mono text-xs">{r.pid}</span> },
                        { key: 'command', label: t.name, render: (r: any) => <span className="font-mono text-xs truncate max-w-[160px] inline-block" title={r.command}>{r.command || r.user}</span> },
                        { key: 'cpuPercent', label: 'CPU %', render: (r: any) => `${r.cpuPercent ?? 0}%` },
                        { key: 'memPercent', label: 'MEM %', render: (r: any) => `${r.memPercent ?? 0}%` },
                      ]} rows={monitorProcesses} />
                    </div>
                    <div className={cardClass}>
                      <h4 className="font-semibold mb-3">{lang === 'de' ? 'CPU-Verlauf (60 Min)' : 'CPU History (60 min)'}</h4>
                      {monitorHistory.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">{lang === 'de' ? 'Noch keine Verlaufsdaten.' : 'No history data yet.'}</p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {monitorHistory.slice(-30).map((h: any, i: number) => (
                            <div key={h.id || i}>
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span className="font-mono">{new Date(h.createdAt).toLocaleTimeString()}</span>
                                <span>{h.cpuUsage ?? 0}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-gate-orange to-gate-purple"
                                  style={{ width: `${Math.min(h.cpuUsage ?? 0, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* ===== MODALS ===== */}

      {/* Docker Container */}
      <Modal open={modal === 'docker'} onClose={() => setModal(null)} title={t.addDocker} darkMode={darkMode}>
        <Select label={t.hosts} darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => setF('hostId', e.target.value)}>
          <option value="">{lang === 'de' ? 'Dieser Rechner (lokal)' : 'This machine (local)'}</option>
          {hosts.filter((h) => !h.isLocal).map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} placeholder="my-container" />
        <Input label={t.image} darkMode={darkMode} value={form.image || ''} onChange={(e: any) => setF('image', e.target.value)} placeholder="nginx:latest" />
        <Input label="Volume (optional)" darkMode={darkMode} value={form.volumeName || ''} onChange={(e: any) => setF('volumeName', e.target.value)} placeholder="my-volume" />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Docker Compose */}
      <Modal open={modal === 'compose'} onClose={() => setModal(null)} title="Docker Compose" darkMode={darkMode}>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} placeholder="my-project" />
        <TextArea label="docker-compose.yml" darkMode={darkMode} rows={12} value={form.content || ''} onChange={(e: any) => setF('content', e.target.value)} />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Volume */}
      <Modal open={modal === 'volume'} onClose={() => setModal(null)} title="Docker Volume" darkMode={darkMode}>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} placeholder="my-volume" />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Rename Volume */}
      <Modal open={modal === 'renameVolume'} onClose={() => setModal(null)} title={t.renameVolume} darkMode={darkMode}>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} readOnly className="opacity-50" />
        <Input label={t.newVolumeName} darkMode={darkMode} value={form.newName || ''} onChange={(e: any) => setF('newName', e.target.value)} placeholder="my-volume-new" />
        <div className="flex gap-2 mt-4">
          <Btn onClick={async () => {
            try {
              setLoading(true);
              await api(`/api/docker/volumes/${encodeURIComponent(form.name)}`, {
                method: 'PUT',
                body: JSON.stringify({ newName: form.newName, hostId: dockerHostFilter || undefined }),
              });
              showSuccess(t.success);
              setModal(null); setForm({});
              loadDocker(dockerHostFilter || undefined);
            } catch (e: any) { showError(e.message); } finally { setLoading(false); }
          }} disabled={loading || !form.newName}>{loading ? t.loading : t.rename}</Btn>
          <Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn>
        </div>
      </Modal>

      {/* Hypervisor */}
      <Modal open={modal === 'hypervisor'} onClose={() => setModal(null)} title={t.addHost} darkMode={darkMode}>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} />
        <Input label={t.ip} darkMode={darkMode} value={form.ip || ''} onChange={(e: any) => setF('ip', e.target.value)} placeholder="192.168.1.100" />
        <Input label={t.port} darkMode={darkMode} type="number" value={form.port || 22} onChange={(e: any) => setF('port', e.target.value)} />
        <Input label={t.username} darkMode={darkMode} value={form.username || 'root'} onChange={(e: any) => setF('username', e.target.value)} />
        <Input label={t.password} darkMode={darkMode} type="password" value={form.password || ''} onChange={(e: any) => setF('password', e.target.value)} />
        <Select label={t.osType} darkMode={darkMode} value={form.osType || 'debian'} onChange={(e: any) => setF('osType', e.target.value)}>
          <option value="debian">Debian</option>
          <option value="ubuntu">Ubuntu</option>
          <option value="rocky">Rocky Linux</option>
          <option value="alma">Alma Linux</option>
          <option value="fedora">Fedora</option>
        </Select>
        <Select label={t.purpose} darkMode={darkMode} value={form.purpose || 'ALL_IN_ONE'} onChange={(e: any) => setF('purpose', e.target.value)}>
          <option value="ALL_IN_ONE">All-in-One</option>
          <option value="DOCKER">Docker</option>
          <option value="PODMAN">Podman</option>
          <option value="LXC">LXC</option>
          <option value="VM_KVM">VM / KVM</option>
        </Select>
        <p className="text-xs text-gray-500 mb-3">SSH-Key wird generiert und Verwaltungstools installiert.</p>
        <div className="flex gap-2"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* VM */}
      <Modal open={modal === 'vm'} onClose={() => setModal(null)} title={t.addVm} darkMode={darkMode}>
        <Select label="Host" darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => setF('hostId', e.target.value)}>
          <option value="">— Select —</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} />
        <Input label={t.vcpus} darkMode={darkMode} type="number" value={form.vcpus || 2} onChange={(e: any) => setF('vcpus', e.target.value)} />
        <Input label={t.memory} darkMode={darkMode} type="number" value={form.memoryMB || 2048} onChange={(e: any) => setF('memoryMB', e.target.value)} />
        <Input label={t.diskSize} darkMode={darkMode} type="number" value={form.diskSizeGB || 20} onChange={(e: any) => setF('diskSizeGB', e.target.value)} />
        <Input label={t.storagePath} darkMode={darkMode} value={form.storagePath || '/var/lib/libvirt/images'} onChange={(e: any) => setF('storagePath', e.target.value)} />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* LXC */}
      <Modal open={modal === 'lxc'} onClose={() => setModal(null)} title={t.addLxc} darkMode={darkMode}>
        <Select label="Host" darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => setF('hostId', e.target.value)}>
          <option value="">— Select —</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} />
        <Select label={t.template} darkMode={darkMode} value={form.template || 'debian'} onChange={(e: any) => setF('template', e.target.value)}>
          {(templates.lxcTemplates || []).map((tpl: any) => <option key={tpl.distro} value={tpl.distro}>{tpl.name}</option>)}
          <option value="debian">Debian</option>
          <option value="ubuntu">Ubuntu</option>
          <option value="alpine">Alpine</option>
          <option value="rocky">Rocky Linux</option>
        </Select>
        <Input label={t.memory} darkMode={darkMode} type="number" value={form.memoryMB || 512} onChange={(e: any) => setF('memoryMB', e.target.value)} />
        <Input label={t.storagePath} darkMode={darkMode} value={form.storagePath || '/var/lib/lxc'} onChange={(e: any) => setF('storagePath', e.target.value)} />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Podman */}
      <Modal open={modal === 'podman'} onClose={() => setModal(null)} title={t.addPodman} darkMode={darkMode}>
        <Select label="Host" darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => setF('hostId', e.target.value)}>
          <option value="">— Select —</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} />
        <Input label={t.image} darkMode={darkMode} value={form.image || ''} onChange={(e: any) => setF('image', e.target.value)} placeholder="alpine:latest" />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* ZFS */}
      <Modal open={modal === 'zfs'} onClose={() => setModal(null)} title={t.createZfs} darkMode={darkMode}>
        <Select label="Host" darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => {
          const v = e.target.value;
          setF('hostId', v);
          if (v) loadDisks(v);
        }}>
          <option value="">— Select —</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Input label={t.name} darkMode={darkMode} value={form.poolName || ''} onChange={(e: any) => setF('poolName', e.target.value)} placeholder="tank" />
        <Select label={t.raidLevel} darkMode={darkMode} value={form.raidLevel || 'mirror'} onChange={(e: any) => setF('raidLevel', e.target.value)}>
          <option value="stripe">Stripe</option>
          <option value="mirror">Mirror</option>
          <option value="raidz1">RAIDZ1</option>
          <option value="raidz2">RAIDZ2</option>
          <option value="raidz3">RAIDZ3</option>
        </Select>
        <Select label={`${t.disks} (UUID)`} darkMode={darkMode} multiple size={6} value={(form.disks || '').split(',').filter(Boolean)} onChange={(e: any) => {
          const vals = Array.from(e.target.selectedOptions).map((o: any) => o.value);
          setF('disks', vals.join(','));
        }}>
          {disks.filter((d) => d.type === 'disk' || !d.type).map((d) => (
            <option key={d.name} value={d.uuid ? `/dev/disk/by-uuid/${d.uuid}` : `/dev/${d.name}`}>
              {d.name} → {d.uuid ? `UUID: ${d.uuid}` : 'keine UUID'} ({d.size})
            </option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 mb-3">Strg+Halt zum Mehrfach-Auswählen</p>
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Storage Pool */}
      <Modal open={modal === 'storage'} onClose={() => setModal(null)} title={t.addStorage} darkMode={darkMode}>
        <Select label="Host" darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => setF('hostId', e.target.value)}>
          <option value="">— Select —</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} />
        <Select label={t.type} darkMode={darkMode} value={form.type || 'ISO'} onChange={(e: any) => setF('type', e.target.value)}>
          <option value="ISO">ISO Images</option>
          <option value="DOCKER_IMAGE">Docker Images</option>
          <option value="LXC_TEMPLATE">LXC Templates</option>
          <option value="PODMAN_IMAGE">Podman Images</option>
          <option value="DOCKER_COMPOSE">Docker Compose</option>
          <option value="VM_DISK">VM Disks</option>
        </Select>
        <Input label={t.path} darkMode={darkMode} value={form.path || ''} onChange={(e: any) => setF('path', e.target.value)} placeholder="/var/lib/gatecore/iso" />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Format Disk */}
      <Modal open={modal === 'format'} onClose={() => setModal(null)} title={t.formatDisk} darkMode={darkMode}>
        <Select label="Host" darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => {
          const v = e.target.value;
          setF('hostId', v);
          if (v) loadDisks(v);
        }}>
          <option value="">— Select —</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Select label={`${t.disks} (UUID)`} darkMode={darkMode} value={form.devicePath ? (disks.find((d: any) => d.uuid && `/dev/disk/by-uuid/${d.uuid}` === form.devicePath)?.uuid || form.devicePath) : ''} onChange={(e: any) => {
          const v = e.target.value;
          const disk = disks.find((d: any) => d.uuid === v);
          setF('devicePath', disk?.uuid ? `/dev/disk/by-uuid/${disk.uuid}` : v);
        }}>
          <option value="">— Select —</option>
          {disks.filter((d: any) => d.type === 'disk' || !d.type).map((d: any) => (
            <option key={d.name} value={d.uuid}>
              {d.name} → {d.uuid ? `UUID: ${d.uuid}` : 'keine UUID'} ({d.size})
            </option>
          ))}
        </Select>
        <Select label="Filesystem" darkMode={darkMode} value={form.fsType || 'ext4'} onChange={(e: any) => setF('fsType', e.target.value)}>
          <option value="ext4">ext4</option>
          <option value="xfs">XFS</option>
          <option value="zfs">ZFS</option>
        </Select>
        <p className="text-xs text-red-400 mb-3">⚠ Alle Daten auf dem Device werden gelöscht!</p>
        <div className="flex gap-2"><Btn onClick={submitForm} disabled={loading} variant="danger">{loading ? t.loading : t.formatDisk}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Passthrough */}
      <Modal open={modal === 'passthrough'} onClose={() => setModal(null)} title={t.addPassthrough} darkMode={darkMode}>
        <Select label="Host" darkMode={darkMode} value={form.hostId || ''} onChange={(e: any) => {
          const v = e.target.value;
          setF('hostId', v);
          setF('description', '');
          setF('deviceId', '');
          setF('guestId', '');
          if (v) loadHardware(v);
        }}>
          <option value="">— Select —</option>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.ip})</option>)}
        </Select>
        <Select label={t.type} darkMode={darkMode} value={form.type || 'PCIE'} onChange={(e: any) => {
          setF('type', e.target.value);
          setF('deviceId', '');
          setF('description', '');
        }}>
          <option value="PCIE">PCIe</option>
          <option value="USB">USB</option>
        </Select>

        {/* Erkannte Geräte zum Auswählen */}
        {(form.hostId) && (
          <Select label={t.selectDevice} darkMode={darkMode} value={form.deviceId || ''} onChange={(e: any) => {
            const v = e.target.value;
            setF('deviceId', v);
            // Beschreibung automatisch aus der Gerätezeile übernehmen
            const devices = form.type === 'USB' ? hardwareDevices.usb : hardwareDevices.pci;
            const line = devices.find((d: string) => extractDeviceId(form.type, d) === v);
            if (line) setF('description', line);
          }}>
            <option value="">— {t.selectDevice} —</option>
            {(form.type === 'USB' ? hardwareDevices.usb : hardwareDevices.pci).map((dev: string, i: number) => (
              <option key={i} value={extractDeviceId(form.type, dev)}>{dev}</option>
            ))}
          </Select>
        )}
        {form.hostId && (form.type === 'USB' ? hardwareDevices.usb : hardwareDevices.pci).length === 0 && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-400">{t.noDevicesFound}</p>
            <button onClick={() => form.hostId && loadHardware(form.hostId)} className="flex items-center gap-1 text-xs font-semibold text-gate-orange hover:underline">
              <RefreshCw className="w-3 h-3" />{t.loadDevices}
            </button>
          </div>
        )}

        <Input label={t.deviceId} darkMode={darkMode} value={form.deviceId || ''} onChange={(e: any) => setF('deviceId', e.target.value)} placeholder="0000:01:00.0 or 1d6b:0002" />
        <Input label={t.description} darkMode={darkMode} value={form.description || ''} onChange={(e: any) => setF('description', e.target.value)} />
        <Select label={t.guestType} darkMode={darkMode} value={form.guestType || 'VM'} onChange={(e: any) => {
          setF('guestType', e.target.value);
          setF('guestId', '');
        }}>
          <option value="VM">VM</option>
          <option value="LXC">LXC</option>
          <option value="DOCKER">Docker</option>
          <option value="PODMAN">Podman</option>
        </Select>

        {/* Gast auswählen (abhängig vom Host & Gast-Typ) */}
        {form.hostId && (() => {
          const host = hosts.find((h: any) => h.id === form.hostId);
          if (!host) return null;
          let guestOptions: any[] = [];
          if (form.guestType === 'VM') guestOptions = host.vms || [];
          else if (form.guestType === 'LXC') guestOptions = host.lxcContainers || [];
          else if (form.guestType === 'PODMAN') guestOptions = host.podmanContainers || [];
          else if (form.guestType === 'DOCKER') guestOptions = host.dockerContainers || [];

          if (guestOptions.length === 0) {
            return (
              <p key="no-guests" className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <span className="text-xs text-amber-400">{t.noGuestsFound}</span>
              </p>
            );
          }

          return (
            <Select label={t.selectGuest} darkMode={darkMode} value={form.guestId || ''} onChange={(e: any) => setF('guestId', e.target.value)}>
              <option value="">— {t.selectGuest} —</option>
              {guestOptions.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name} ({g.status || '—'})</option>
              ))}
            </Select>
          );
        })()}
        <Input label="Guest ID" darkMode={darkMode} value={form.guestId || ''} onChange={(e: any) => setF('guestId', e.target.value)} placeholder="Optional – wird bei Auswahl automatisch gesetzt" />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* User */}
      <Modal open={modal === 'user'} onClose={() => setModal(null)} title={t.addUser} darkMode={darkMode}>
        <Input label={t.username} darkMode={darkMode} value={form.username || ''} onChange={(e: any) => setF('username', e.target.value)} />
        <Input label={t.password} darkMode={darkMode} type="password" value={form.password || ''} onChange={(e: any) => setF('password', e.target.value)} />
        <Select label={t.role} darkMode={darkMode} value={form.role || 'USER'} onChange={(e: any) => setF('role', e.target.value)}>
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
          <option value="VIEWER">VIEWER</option>
        </Select>
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Change Password */}
      <Modal open={modal === 'password'} onClose={() => setModal(null)} title={t.changePassword} darkMode={darkMode}>
        <Input label={t.password} darkMode={darkMode} type="password" value={form.password || ''} onChange={(e: any) => setF('password', e.target.value)} />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.save}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* LDAP Config */}
      <Modal open={modal === 'ldap'} onClose={() => setModal(null)} title={t.ldapConfig} darkMode={darkMode}>
        <div className="mb-3 flex items-center gap-2">
          <input type="checkbox" checked={form.enabled || false} onChange={(e: any) => setF('enabled', e.target.checked)} id="ldap-en" />
          <label htmlFor="ldap-en" className="text-sm">{t.enabled}</label>
        </div>
        <Input label={t.url} darkMode={darkMode} value={form.url || ''} onChange={(e: any) => setF('url', e.target.value)} placeholder="ldap://dc.example.com:389" />
        <Input label={t.bindDn} darkMode={darkMode} value={form.bindDn || ''} onChange={(e: any) => setF('bindDn', e.target.value)} placeholder="CN=admin,DC=example,DC=com" />
        <Input label={t.bindPassword} darkMode={darkMode} type="password" value={form.bindPassword || ''} onChange={(e: any) => setF('bindPassword', e.target.value)} />
        <Input label={t.searchBase} darkMode={darkMode} value={form.searchBase || ''} onChange={(e: any) => setF('searchBase', e.target.value)} placeholder="OU=Users,DC=example,DC=com" />
        <Input label={t.userFilter} darkMode={darkMode} value={form.userFilter || '(sAMAccountName={{username}})'} onChange={(e: any) => setF('userFilter', e.target.value)} />
        <div className="flex gap-2 mt-4"><Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.save}</Btn><Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn></div>
      </Modal>

      {/* Cluster Node */}
      <Modal open={modal === 'cluster'} onClose={() => setModal(null)} title={t.addNode} darkMode={darkMode}>
        <Input label={t.name} darkMode={darkMode} value={form.name || ''} onChange={(e: any) => setF('name', e.target.value)} />
        <Input label={t.endpoint} darkMode={darkMode} value={form.endpoint || ''} onChange={(e: any) => setF('endpoint', e.target.value)} placeholder="https://node2.example.com:3000" />
        <Input label={t.expiresIn} darkMode={darkMode} type="number" value={form.expiresInDays || ''} onChange={(e: any) => setF('expiresInDays', e.target.value)} placeholder="30 = 30 Tage / leer = unbegrenzt" />
        <p className="text-xs text-gray-500 mb-3">{t.keyWarning}</p>
        {form.generatedKey && (
          <div className="mb-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-xs font-semibold text-emerald-400 mb-1">{t.generatedKey}:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs break-all">{form.generatedKey}</code>
              <button onClick={() => { navigator.clipboard.writeText(form.generatedKey); showSuccess(t.keyCopied); }} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title={t.copyKey}><Copy className="w-3.5 h-3.5" /></button>
            </div>
            <p className="text-xs text-amber-400 mt-2">{t.keyWarning}</p>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Btn onClick={submitForm} disabled={loading}>{loading ? t.loading : t.create}</Btn>
          <Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn>
        </div>
      </Modal>

      {/* Edit Container (Ports & Volumes) */}
      <Modal open={modal === 'editContainer'} onClose={() => setModal(null)} title={`${t.editContainer}: ${editContainerName}`} darkMode={darkMode}>
        <p className="text-xs text-gray-400 mb-3">{t.image}: <span className="font-mono text-gate-purple">{editImage}</span></p>

        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" />{t.ports}
        </h4>
        <div className="space-y-2 mb-4">
          {editPorts.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                readOnly
                value={p.container}
                className={`w-20 px-2 py-1.5 rounded border text-xs font-mono ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                placeholder="80"
              />
              <input
                value={p.host}
                onChange={(e) => setPortField(i, 'host', e.target.value)}
                disabled={!p.published}
                className={`w-20 px-2 py-1.5 rounded border text-xs font-mono ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'} ${!p.published ? 'opacity-40' : ''}`}
                placeholder="8080"
              />
              <select value={p.protocol} onChange={(e) => setPortField(i, 'protocol', e.target.value)}
                className={`px-2 py-1.5 rounded border text-xs ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}>
                <option value="tcp">tcp</option>
                <option value="udp">udp</option>
              </select>
              <span className="text-xs text-gray-400 w-16">{p.published ? '→' : '🔒'}</span>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={p.published} onChange={(e) => setPortField(i, 'published', String(e.target.checked))} />
                {p.published ? t.start : t.stop}
              </label>
              <button onClick={() => removePortRow(i)} className="p-1 rounded hover:bg-red-500/20 text-red-400" title={t.removePort}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <Btn onClick={addPortRow} variant="ghost"><Plus className="w-3.5 h-3.5" />{t.addPort}</Btn>
        </div>

        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5" />{t.volumes}
        </h4>
        <div className="space-y-2 mb-4">
          {editVolumes.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={v.host}
                onChange={(e) => setVolumeField(i, 'host', e.target.value)}
                className={`flex-1 px-2 py-1.5 rounded border text-xs font-mono ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                placeholder="/host/path"
              />
              <span className="text-gray-400 text-xs">:</span>
              <input
                value={v.container}
                onChange={(e) => setVolumeField(i, 'container', e.target.value)}
                className={`flex-1 px-2 py-1.5 rounded border text-xs font-mono ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                placeholder="/container/path"
              />
              <select value={v.mode} onChange={(e) => setVolumeField(i, 'mode', e.target.value)}
                className={`px-2 py-1.5 rounded border text-xs ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}>
                <option value="rw">rw</option>
                <option value="ro">ro</option>
              </select>
              <button onClick={() => removeVolumeRow(i)} className="p-1 rounded hover:bg-red-500/20 text-red-400" title={t.removeVolume}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <Btn onClick={addVolumeRow} variant="ghost"><Plus className="w-3.5 h-3.5" />{t.addVolume}</Btn>
        </div>

        <div className="flex gap-2 justify-end border-t border-gray-700 pt-4">
          <Btn onClick={saveEditContainer} disabled={loading} variant="orange"><Save className="w-4 h-4" />{t.apply}</Btn>
          <Btn onClick={() => setModal(null)} variant="ghost">{t.cancel}</Btn>
        </div>
      </Modal>

      {/* Logs */}
      <Modal open={modal === 'logs'} onClose={() => setModal(null)} title={logsTitle} darkMode={darkMode}>
        <pre className={`w-full h-96 overflow-y-auto p-3 rounded-lg text-xs font-mono whitespace-pre-wrap ${darkMode ? 'bg-black text-green-400' : 'bg-gray-900 text-green-400'}`}>{logsData || t.loading}</pre>
        <div className="flex justify-end mt-3"><Btn onClick={() => setModal(null)} variant="ghost">{t.close}</Btn></div>
      </Modal>

      {/* Shell */}
      <Modal open={modal === 'shell'} onClose={() => { setModal(null); wsRef?.close(); setWsRef(null); }} title={`${t.shell}: ${shellContainer}`} darkMode={darkMode}>
        <pre className={`w-full h-64 overflow-y-auto p-3 rounded-lg text-xs font-mono ${darkMode ? 'bg-black text-green-400' : 'bg-gray-900 text-green-400'}`}>{shellOutput || 'Connecting...'}</pre>
        <div className="flex gap-2 mt-3">
          <input value={shellInput} onChange={(e) => setShellInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendShell()}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gate-orange ${darkMode ? 'bg-slate-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
            placeholder="command..." />
          <Btn onClick={sendShell} variant="orange"><Play className="w-4 h-4" /></Btn>
        </div>
      </Modal>
    </div>
  );
}