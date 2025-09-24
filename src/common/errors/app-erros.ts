export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(id?: string) {
    if (typeof id === "string" || "number") {
      super(`Object with ID ${id} not found`, 404);
    } else {
      super(`Not found`);
    }
  }
}

export class UnauthorizedAccessError extends AppError {
  constructor() {
    super("You do not have access", 403);
  }
}

export class ValidationError extends AppError {
  constructor() {
    super(`Validation failed`, 400);
  }
}
