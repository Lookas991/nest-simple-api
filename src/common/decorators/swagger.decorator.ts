import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiExtraModels,
} from "@nestjs/swagger";
import { getSchemaPath } from "@nestjs/swagger";
import { BaseQueryDto } from "../dto";

// Generic Auth + Endpoint decorator
interface EndpointOptions {
  summary: string;
  description?: string;
  responseType?: Type<unknown>;
  bodyType?: Type<unknown>;
  status?: number;
  auth?: boolean;
}

// Auth-required endpoint (GET, POST, etc.)
export function ApiAuthEndpoint(options: EndpointOptions) {
  return applyDecorators(
    ...(options.auth === false ? [] : [ApiBearerAuth()]),
    ApiOperation({
      summary: options.summary,
      description: options.description || "",
    }),
    options.bodyType ? ApiBody({ type: options.bodyType }) : (target) => target,
    options.responseType
      ? ApiResponse({
          status: options.status ?? 200,
          description: "Success",
          type: options.responseType,
        })
      : (target) => target,
    ApiStandardErrorResponses(),
  );
}

// Simple POST endpoint (no auth)
export function ApiPostEndpoint(
  summary: string,
  bodyType: Type<unknown>,
  responseType?: Type<unknown>,
  status = 201,
) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiBody({ type: bodyType }),
    ApiResponse({ status, description: "Created", type: responseType }),
  );
}

// Paginated List endpoint
export function ApiPaginatedEndpoint(summary: string, itemType: Type<unknown>) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiExtraModels(BaseQueryDto),
    ApiQuery({ name: "page", required: false, type: Number }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "search", required: false, type: String }),
    ApiQuery({ name: "sortBy", required: false, type: String }),
    ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"] }),
    ApiResponse({
      status: 200,
      description: "Paginated response",
      schema: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: getSchemaPath(itemType) },
          },
          pagination: {
            type: "object",
            properties: {
              totalItems: { type: "number" },
              itemCount: { type: "number" },
              itemsPerPage: { type: "number" },
              totalPages: { type: "number" },
              currentPage: { type: "number" },
            },
          },
        },
      },
    }),
  );
}

// Delete endpoint
export function ApiDeleteEndpoint(summary: string) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiResponse({ status: 200, description: "Successfully deleted" }),
    ApiParam({ name: "id", required: true }),
  );
}

// Single GET endpoint by ID
export function ApiGetByIdEndpoint(
  summary: string,
  responseType: Type<unknown>,
) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiResponse({
      status: 200,
      description: "Fetched successfully",
      type: responseType,
    }),
    ApiParam({ name: "id", required: true }),
  );
}

// Add Swagger tags to class
export function ApiTagsWithAuth(...tags: string[]) {
  return applyDecorators(ApiTags(...tags), ApiBearerAuth());
}

export function ApiStandardErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: "Validation error",
      schema: {
        example: {
          error: {
            message: ["title should not be empty"],
            statusCode: 400,
            error: "Bad Request",
          },
          meta: {
            timestamp: "2025-07-09T00:00:00.000Z",
            method: "POST",
            path: "/projects",
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: "Unauthorized" }),
    ApiForbiddenResponse({ description: "Forbidden" }),
    ApiInternalServerErrorResponse({ description: "Internal server error" }),
  );
}
