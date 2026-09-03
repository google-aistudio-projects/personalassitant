import { OperatingSystem } from '../types';

export function detectOS(): OperatingSystem {
  if (typeof window === 'undefined') return 'windows';
  const ua = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator as any)?.userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || '';

  if (platform.includes('win') || ua.includes('windows')) {
    return 'windows';
  }
  if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) {
    return 'macos';
  }
  if (platform.includes('linux') || ua.includes('linux') || ua.includes('x11')) {
    return 'linux';
  }
  return 'windows';
}

export function getOSLabel(os: OperatingSystem): string {
  switch (os) {
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'Cross-Platform';
  }
}

export interface OSGuide {
  title: string;
  badge: string;
  corsCommand: string;
  corsAltCommand?: string;
  modelsPath: string;
  pythonVenvCommand: string;
  pythonActivateCommand: string;
  audioPackageTip: string;
  systemTrayTip: string;
}

export const OS_GUIDES: Record<OperatingSystem, OSGuide> = {
  windows: {
    title: 'Windows 11 / 10',
    badge: 'Windows',
    corsCommand: '$env:OLLAMA_ORIGINS="*" ; ollama serve',
    corsAltCommand: 'set OLLAMA_ORIGINS=* && ollama serve',
    modelsPath: '%USERPROFILE%\\.ollama\\models',
    pythonVenvCommand: 'py -m venv venv',
    pythonActivateCommand: '.\\venv\\Scripts\\Activate.ps1',
    audioPackageTip: 'Run: pip install SpeechRecognition pyttsx3 requests pyaudio. If PyAudio fails on Windows, install pipwin: "pip install pipwin && pipwin install pyaudio".',
    systemTrayTip: 'If Ollama is running in the Windows System Tray, right-click and choose "Quit Ollama" before launching with OLLAMA_ORIGINS="*".'
  },
  macos: {
    title: 'macOS (Apple Silicon & Intel)',
    badge: 'macOS',
    corsCommand: 'OLLAMA_ORIGINS="*" ollama serve',
    corsAltCommand: 'launchctl setenv OLLAMA_ORIGINS "*"',
    modelsPath: '~/.ollama/models',
    pythonVenvCommand: 'python3 -m venv venv',
    pythonActivateCommand: 'source venv/bin/activate',
    audioPackageTip: 'Run: brew install portaudio && pip install SpeechRecognition pyttsx3 requests pyaudio',
    systemTrayTip: 'Quit Ollama from the top macOS menu bar before running the CORS serve command in Terminal.'
  },
  linux: {
    title: 'Linux (Ubuntu, Debian, Fedora, Arch)',
    badge: 'Linux',
    corsCommand: 'OLLAMA_ORIGINS="*" ollama serve',
    corsAltCommand: 'sudo systemctl edit ollama.service  # Add Environment="OLLAMA_ORIGINS=*"',
    modelsPath: '/usr/share/ollama/.ollama/models or ~/.ollama/models',
    pythonVenvCommand: 'python3 -m venv venv',
    pythonActivateCommand: 'source venv/bin/activate',
    audioPackageTip: 'Run: sudo apt install python3-pyaudio espeak && pip install SpeechRecognition pyttsx3 requests',
    systemTrayTip: 'If running as a systemd service, reload with: sudo systemctl daemon-reload && sudo systemctl restart ollama'
  },
  unknown: {
    title: 'Generic OS',
    badge: 'Cross-Platform',
    corsCommand: 'OLLAMA_ORIGINS="*" ollama serve',
    modelsPath: '~/.ollama/models',
    pythonVenvCommand: 'python3 -m venv venv',
    pythonActivateCommand: 'source venv/bin/activate',
    audioPackageTip: 'pip install SpeechRecognition pyttsx3 requests pyaudio',
    systemTrayTip: 'Ensure Ollama allows browser origins via OLLAMA_ORIGINS="*".'
  }
};
