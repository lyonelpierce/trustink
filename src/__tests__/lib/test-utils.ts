import { Mock } from 'jest-mock';
import { auth } from '@clerk/nextjs/server';

// Define a proper type for the MediaRecorder mock
interface MockMediaRecorder {
  start: jest.Mock;
  stop: jest.Mock;
  pause: jest.Mock;
  resume: jest.Mock;
  requestData: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  dispatchEvent: jest.Mock;
  state: string;
  audioBitsPerSecond: number;
  videoBitsPerSecond: number;
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onpause: ((event: Event) => void) | null;
  onresume: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
  onstop: ((event: Event) => void) | null;
  stream: MediaStream;
  ignoreMutedMedia: boolean;
}

interface MockMediaRecorderConstructor {
  new (stream: MediaStream, options?: MediaRecorderOptions): MockMediaRecorder;
  isTypeSupported: jest.Mock;
  prototype: MediaRecorder;
}

/**
 * Create a properly typed MediaRecorder mock
 */
export function createMediaRecorderMock() {
  const mockMediaRecorder: MockMediaRecorder = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    requestData: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    state: 'inactive',
    audioBitsPerSecond: 0,
    videoBitsPerSecond: 0,
    mimeType: '',
    ondataavailable: null,
    onerror: null,
    onpause: null,
    onresume: null,
    onstart: null,
    onstop: null,
    stream: {} as MediaStream,
    ignoreMutedMedia: false
  };

  // Create constructor function
  const MediaRecorderMock = function(this: MockMediaRecorder, stream: MediaStream, options?: MediaRecorderOptions) {
    Object.assign(this, mockMediaRecorder, { stream });
    return this;
  } as unknown as MockMediaRecorderConstructor;

  // Add static method
  MediaRecorderMock.isTypeSupported = jest.fn().mockReturnValue(true);
  MediaRecorderMock.prototype = {} as MediaRecorder;

  return {
    MediaRecorderMock: MediaRecorderMock as unknown as typeof MediaRecorder,
    mockMediaRecorder
  };
}

/**
 * Create a mock MediaStream
 */
export function createMediaStreamMock() {
  return {
    getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }])
  };
}

/**
 * Type-safe mock for useDocumentStore
 */
export function mockUseDocumentStore<T>(returnValue: T) {
  return jest.fn().mockReturnValue(returnValue) as unknown as jest.Mock;
}

interface MockAuthFunction extends jest.Mock {
  protect: jest.Mock;
}

/**
 * Type-safe mock for auth function
 */
export function mockAuth(returnValue: { userId?: string | null } = {}) {
  const protect = jest.fn().mockImplementation(() => returnValue);
  const mockAuthFn = jest.fn().mockResolvedValue({ ...returnValue, protect }) as MockAuthFunction;
  mockAuthFn.protect = protect;
  return mockAuthFn as unknown as jest.MockedFunction<typeof auth>;
}

/**
 * Type-safe mock for NextResponse
 */
export function createNextResponseMock(status: number, body: any) {
  return {
    status,
    clone: () => ({
      json: () => Promise.resolve(body)
    }),
    json: () => Promise.resolve(body)
  };
} 