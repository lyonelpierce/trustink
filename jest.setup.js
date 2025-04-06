// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock PDF-lib
jest.mock('pdf-lib', () => {
  return {
    PDFDocument: {
      load: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          getPageCount: jest.fn().mockReturnValue(3),
          getPage: jest.fn().mockImplementation(() => {
            return {
              getSize: jest.fn().mockReturnValue({ width: 612, height: 792 })
            };
          })
        });
      })
    }
  };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn()
  })),
  useParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/')
}));

// Mock the toast notification
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock Zustand store
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn(() => ({
    setCurrentDocument: jest.fn(),
    setDocumentLoading: jest.fn(),
    isDocumentLoading: false
  }))
}));

// Mock error utils
jest.mock('@/lib/error-utils', () => ({
  handleError: jest.fn(),
  safeAsync: jest.fn().mockImplementation((promise) => promise.then(result => [result, null]).catch(error => [null, error]))
}));

// Global mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Web Speech API
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    this.maxAlternatives = 1;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
    this.onstart = null;
  }
  
  start() {}
  stop() {}
  abort() {}
}

class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text || '';
    this.lang = 'en-US';
    this.pitch = 1;
    this.rate = 1;
    this.volume = 1;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
    this.onpause = null;
    this.onresume = null;
    this.onstart = null;
  }
}

// Setup mock for Web Speech API
Object.defineProperty(global, 'SpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true
});

Object.defineProperty(global, 'webkitSpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true
});

Object.defineProperty(global, 'SpeechSynthesisUtterance', {
  value: MockSpeechSynthesisUtterance,
  writable: true
});

Object.defineProperty(global, 'speechSynthesis', {
  value: {
    speaking: false,
    paused: false,
    pending: false,
    onvoiceschanged: null,
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn().mockReturnValue([]),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  },
  writable: true
}); 