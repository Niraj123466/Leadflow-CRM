import "@testing-library/jest-dom";
import { vi } from "vitest";

/* Suppress expected console.error calls from React error boundaries in tests. */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

/* Mock the browser fetch so we don't hit the network. */
vi.stubGlobal("fetch", vi.fn());