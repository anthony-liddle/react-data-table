/**
 * Join class names, skipping falsy parts. The components carry only their own
 * `rdt-` classes plus whatever a consumer passes in, so there is nothing to
 * de-duplicate and no need for a merging library.
 */
export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');
