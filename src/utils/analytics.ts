type Gtag = {
  (
    command: 'event',
    eventName: string,
    parameters?: Record<string, unknown>
  ): void;

  (
    command: 'get',
    targetId: string,
    fieldName: string,
    callback: (value: string) => void
  ): void;
};

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

export function registrarEvento(
  nomeEvento: string,
  parametros?: Record<string, unknown>
) {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', nomeEvento, parametros);
}

export function obterClientId(): Promise<string | null> {
  return new Promise((resolve) => {
    if (
      typeof window === 'undefined' ||
      typeof window.gtag !== 'function'
    ) {
      resolve(null);
      return;
    }

    window.gtag(
      'get',
      process.env.NEXT_PUBLIC_GA_ID!,
      'client_id',
      (clientId: string) => {
        resolve(clientId || null);
      }
    );
  });
}