import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any
  ) {
    const errorName = CustomException.getErrorName(status);
    super(
      {
        message,
        error: errorName,
        details,
        timestamp: new Date().toISOString(),
      },
      status
    );
  }

  private static getErrorName(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }
}

export class ValidationException extends CustomException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, details);
  }
}

export class AuthenticationException extends CustomException {
  constructor(message: string = 'Authentication failed') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthorizationException extends CustomException {
  constructor(message: string = 'Access denied') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ResourceNotFoundException extends CustomException {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends CustomException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}

export class ServiceUnavailableException extends CustomException {
  constructor(service: string = 'Service') {
    super(`${service} is currently unavailable`, HttpStatus.SERVICE_UNAVAILABLE);
  }
} 