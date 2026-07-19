export interface Logger {
  info(msg: string, meta?: any): void;
  error(msg: string, err?: any, meta?: any): void;
  warn(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
}

export class SharedLogger implements Logger {
  private context: string;
  private isNode: boolean;

  constructor(context: string) {
    this.context = context;
    // Check if we are running in Node.js dynamically without reference to global process types
    this.isNode = typeof globalThis !== 'undefined' &&
                  'process' in globalThis &&
                  (globalThis as any).process?.versions?.node != null;
  }

  private format(level: string, msg: string, err?: any, meta?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      level,
      time: timestamp,
      context: this.context,
      msg,
      ...(err ? { err: err instanceof Error ? { message: err.message, stack: err.stack } : err } : {}),
      ...(meta || {}),
    };

    if (this.isNode) {
      console.log(JSON.stringify(logData));
    } else {
      // Browser style pretty console
      const colors = {
        info: 'color: #06b6d4',
        warn: 'color: #f59e0b',
        error: 'color: #ef4444; font-weight: bold',
        debug: 'color: #8e8ea8',
      };
      const color = colors[level as keyof typeof colors] || '';
      console.log(
        `%c[${level.toUpperCase()}]%c [${this.context}] ${msg}`,
        color,
        'color: inherit',
        ...(meta ? [meta] : []),
        ...(err ? [err] : [])
      );
    }
  }

  info(msg: string, meta?: any) {
    this.format('info', msg, undefined, meta);
  }

  warn(msg: string, meta?: any) {
    this.format('warn', msg, undefined, meta);
  }

  error(msg: string, err?: any, meta?: any) {
    this.format('error', msg, err, meta);
  }

  debug(msg: string, meta?: any) {
    const isDev = typeof globalThis !== 'undefined' &&
                  'process' in globalThis &&
                  (globalThis as any).process?.env?.NODE_ENV === 'development';
    if (isDev) {
      this.format('debug', msg, undefined, meta);
    }
  }
}

export const createLogger = (context: string) => new SharedLogger(context);
