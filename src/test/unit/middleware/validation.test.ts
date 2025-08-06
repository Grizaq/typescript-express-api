// src/test/unit/middleware/validation.test.ts
import { Request, Response } from "express";
import {
  validateTodoCreate,
  validateTodoUpdate,
  validateTagCreate,
  validateUserRegistration,
  validateLogin,
  validateVerification,
  validateRefreshToken,
} from "../../../middleware/validation.middleware";
import { ValidationError } from "../../../utils/errors";

// Mock Express objects
const mockRequest = (body = {}) => ({ body } as Request);
const mockResponse = () => ({} as Response);
// Fix: Define mockNext with proper typing for Jest mock functions
const mockNext = jest.fn() as jest.Mock;

describe("Validation Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateTodoCreate", () => {
    it("should call next() for valid todo data", () => {
      const req = mockRequest({
        title: "Valid Todo",
        description: "A description",
        priority: "medium",
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      // Ensure next wasn't called with an error
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should return error for missing title", () => {
      const req = mockRequest({
        description: "Missing title",
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain("Title is required");
    });

    it("should accept a long title", () => {
      const longTitle = "A".repeat(100);

      const req = mockRequest({
        title: longTitle,
        description: "Valid description",
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      // If your validation doesn't check max length, it should pass
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should return error for invalid priority", () => {
      const req = mockRequest({
        title: "Valid Title",
        description: "A description",
        priority: "invalid-priority", // Not in the allowed list
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "Priority must be one of"
      );
    });

    it("should validate optional fields when present", () => {
      const req = mockRequest({
        title: "Valid Title",
        description: "A description",
        imageUrls: "not-an-array", // Should be an array
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "Image URLs must be an array"
      );
    });

    it("should validate short title length", () => {
      const longTitle = "A".repeat(1);

      const req = mockRequest({
        title: longTitle,
        description: "Valid description",
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "Title must be at least 3 characters long"
      );
    });

    it("should accept imageUrls array without URL validation", () => {
      const req = mockRequest({
        title: "Valid Title",
        description: "Valid description",
        imageUrls: ["not-a-url", "http://valid-url.com"],
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      // If your validation doesn't check URL format, it should pass
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should validate imageUrls is an array", () => {
      const req = mockRequest({
        title: "Valid Title",
        description: "Valid description",
        imageUrls: "not-an-array", // This is a string, not an array
      });

      validateTodoCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "Image URLs must be an array"
      );
    });
  });

  describe("validateTagCreate", () => {
    it("should call next() for valid tag data", () => {
      const req = mockRequest({
        name: "valid-tag",
      });

      validateTagCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should return error for missing tag name", () => {
      const req = mockRequest({});

      validateTagCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "Tag name is required"
      );
    });

    it("should return error for empty tag name", () => {
      const req = mockRequest({
        name: "",
      });

      validateTagCreate(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "Tag name is required"
      );
    });
  });

  describe("validateUserRegistration", () => {
    it("should call next() for valid registration data", () => {
      const req = mockRequest({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      validateUserRegistration(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should return error for invalid email format", () => {
      const req = mockRequest({
        name: "Test User",
        email: "not-an-email",
        password: "password123",
      });

      validateUserRegistration(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "Invalid email format"
      );
    });

    it("should return error for password too short", () => {
      const req = mockRequest({
        name: "Test User",
        email: "test@example.com",
        password: "short", // Less than 8 characters
      });

      validateUserRegistration(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext.mock.calls[0][0].message).toContain(
        "at least 8 characters"
      );
    });
  });

  it("should validate name is required", () => {
    const req = mockRequest({
      email: "test@example.com",
      password: "validpassword",
    });

    validateUserRegistration(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Name is required");
  });

  it("should validate name length", () => {
    const req = mockRequest({
      name: "A", // Only 1 character
      email: "test@example.com",
      password: "validpassword",
    });

    validateUserRegistration(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain(
      "Name must be at least 2 characters long"
    );
  });
});

describe("validateTodoUpdate", () => {
  it("should allow partial updates with valid fields", () => {
    const req = mockRequest({
      title: "Updated Title",
      // No description or other fields required
    });

    validateTodoUpdate(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should validate title length when provided", () => {
    const req = mockRequest({
      title: "AB", // Too short
    });

    validateTodoUpdate(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain(
      "at least 3 characters"
    );
  });

  it("should validate priority when provided", () => {
    const req = mockRequest({
      priority: "not-valid",
    });

    validateTodoUpdate(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain(
      "Priority must be one of"
    );
  });

  it("should allow empty request body", () => {
    const req = mockRequest({});

    validateTodoUpdate(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(); // No error
  });
});

describe("validateLogin", () => {
  it("should call next() for valid login data", () => {
    const req = mockRequest({
      email: "user@example.com",
      password: "validpassword",
    });

    validateLogin(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should return error for missing email", () => {
    const req = mockRequest({
      password: "validpassword",
    });

    validateLogin(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Email is required");
  });

  it("should return error for missing password", () => {
    const req = mockRequest({
      email: "user@example.com",
    });

    validateLogin(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Password is required");
  });

  it("should not validate email format during login", () => {
    const req = mockRequest({
      email: "not-an-email", // Invalid format but validateLogin doesn't check this
      password: "validpassword",
    });

    validateLogin(req, mockResponse(), mockNext);

    // Since validateLogin doesn't check email format, this should pass
    expect(mockNext).toHaveBeenCalledWith(); // No error expected
  });

  it("should validate email presence during login", () => {
    const req = mockRequest({
      // No email provided
      password: "validpassword",
    });

    validateLogin(req, mockResponse(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Email is required");
  });
});

describe("validateTodoUpdate", () => {
  it("should allow empty updates", () => {
    const req = mockRequest({});
    validateTodoUpdate(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // No error
  });
  
  it("should validate completed is boolean", () => {
    const req = mockRequest({
      completed: "not-a-boolean"
    });
    validateTodoUpdate(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Completed status must be a boolean");
  });
  
  it("should validate dueDate format", () => {
    const req = mockRequest({
      dueDate: "not-a-date"
    });
    validateTodoUpdate(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Due date must be a valid date");
  });
});

describe("validateVerification", () => {
  it("should validate token is required", () => {
    const req = mockRequest({});
    validateVerification(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Verification token is required");
  });
  
  it("should validate token is 6 digits", () => {
    const req = mockRequest({
      token: "12345" // Only 5 digits
    });
    validateVerification(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("must be a 6-digit number");
  });
  
  it("should validate token contains only digits", () => {
    const req = mockRequest({
      token: "abcdef" // 6 characters but not digits
    });
    validateVerification(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("must be a 6-digit number");
  });
  
  it("should accept valid 6-digit token", () => {
    const req = mockRequest({
      token: "123456" // Valid 6-digit token
    });
    validateVerification(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // No error
  });
});

describe("validateRefreshToken", () => {
  it("should accept token from body", () => {
    const req = mockRequest({
      refreshToken: "valid-token"
    });
    // Mock req.cookies
    req.cookies = {};
    
    validateRefreshToken(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // No error
  });
  
  it("should accept token from cookies", () => {
    const req = mockRequest({});
    // Mock req.cookies
    req.cookies = { refreshToken: "valid-token" };
    
    validateRefreshToken(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // No error
  });
  
  it("should validate token is required", () => {
    const req = mockRequest({});
    // Empty cookies
    req.cookies = {};
    
    validateRefreshToken(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(mockNext.mock.calls[0][0].message).toContain("Refresh token is required");
  });
});

