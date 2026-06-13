// Dependency-free error class so validators/tests can import it without pulling
// in the server auth stack (api.ts → auth.ts). Re-exported from @/lib/api.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
