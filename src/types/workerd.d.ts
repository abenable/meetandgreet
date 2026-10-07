// Minimal type declarations for the Cloudflare Workers runtime APIs used by
// this project. Declared locally (instead of including @cloudflare/workers
// -types globally) so the Workers runtime types do not interfere with the
// DOM/lib types used by the rest of the codebase.

declare module 'cloudflare:workers' {
  export abstract class DurableObject<Env = unknown> {
    constructor(state: DurableObjectState, env: Env)
    ctx: DurableObjectState
    env: Env
  }
  export const env: Cloudflare.Env
}

interface DurableObjectState {
  acceptWebSocket(webSocket: WebSocket, tags?: string[]): void
  getWebSockets(tag?: string): WebSocket[]
}

interface DurableObjectRpc {
  [method: string]: (...args: any[]) => Promise<any>
}

interface DurableObjectStub<T = unknown> extends DurableObjectRpc {
  fetch(request: Request): Promise<Response>
}

interface DurableObjectId {
  toString(): string
}

interface DurableObjectNamespace<T = unknown> {
  idFromName(name: string): DurableObjectId
  idFromString(id: string): DurableObjectId
  newUniqueId(): DurableObjectId
  get(id: DurableObjectId): DurableObjectStub<T>
}

interface DurableObjectBranded {
  readonly [Symbol.toStringTag]: string
}

declare const WebSocketPair: {
  new (): { 0: WebSocket; 1: WebSocket }
}

interface WebSocket {
  serializeAttachment(value: unknown): void
  deserializeAttachment(): any
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void
  passThroughOnException(): void
}

interface ResponseInit {
  webSocket?: WebSocket
}

interface ExportedHandler<Env = unknown> {
  fetch?(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response>
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBufferView | ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>
  delete(keys: string | string[]): Promise<void>
}

declare namespace Cloudflare {
  interface Env {
    R2: R2Bucket
    /** Durable Object that owns all WebSocket connections */
    WEB_SOCKET_HUB: DurableObjectNamespace<DurableObjectBranded>
  }
}
