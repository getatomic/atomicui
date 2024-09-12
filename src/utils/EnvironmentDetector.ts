// TODO: how to prevent node from compiling this into a static file?

export type Framework = 'react' | 'nextjs' | 'remix' | 'vue' | 'unknown';
export type Runtime = 'node' | 'bun' | 'edge' | 'browser' | 'unknown';
export type Environment = 'server' | 'client' | 'unknown';

export function detectFramework(): Framework {
  if (typeof window !== 'undefined') {
    if ((window as any).__NEXT_DATA__) return 'nextjs';
    if ((window as any).REACT_APP) return 'react';
  }
  if (typeof process !== 'undefined') {
    if (process.env.__NEXT_PROCESSED_ENV !== undefined) return 'nextjs';
  }
  return 'unknown';
}

export function detectRuntime(): Runtime {
  if (typeof window !== 'undefined') {
    return 'browser';
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }
  if (typeof process !== 'undefined' && process.versions?.bun) {
    return 'bun';
  }
  return 'unknown';
}

export function detectEnvironment(): Environment {
  if (typeof window === 'undefined') {
    return 'server';
  }
  if (typeof window !== 'undefined') {
    return 'client';
  }
  return 'unknown';
}

export function isServerSide(): boolean {
  return detectEnvironment() === 'server';
}

export function isClientSide(): boolean {
  return detectEnvironment() === 'client';
}

export function getFullEnvironmentInfo() {
  return {
    framework: detectFramework(),
    runtime: detectRuntime(),
    environment: detectEnvironment(),
  };
}

// Helper function to check if we're in a specific environment
export function isEnvironment(framework?: Framework, runtime?: Runtime, environment?: Environment): boolean {
  const info = getFullEnvironmentInfo();
  return (
    (framework ? info.framework === framework : true) &&
    (runtime ? info.runtime === runtime : true) &&
    (environment ? info.environment === environment : true)
  );
}