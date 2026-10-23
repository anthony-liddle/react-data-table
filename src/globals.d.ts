// `process.env.NODE_ENV` is statically replaced by bundlers (and defined by
// Vitest); this ambient declaration avoids pulling in @types/node for it.
declare const process: { env: { NODE_ENV?: string } };
