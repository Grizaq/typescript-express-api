// src/test/integration/auth.test.ts
import { Kysely } from "kysely";
import { Database } from "../../db/schema";
import { createTestDb, tearDownTestDb } from "../setup/test-db";
import { createTestApp } from "../setup/test-app";
import { loadFixtures, clearFixtures } from "../fixtures";
import { RequestTestHelper } from "../helpers/request-helper";
import { Express } from "express";

describe("Auth API", () => {
  let db: Kysely<Database>;
  let requestHelper: RequestTestHelper;
  let app: Express;
  let testApp: any; // Add this to store the full test app

  beforeAll(async () => {
    // Set up the test database
    db = await createTestDb();

    // Create the test app
    testApp = createTestApp(db); // Store the full test app
    app = testApp.app;

    // Create request helper
    requestHelper = new RequestTestHelper(app);

    // Load test data
    await loadFixtures(db);
    
    // Log that we're using the mock email service
    console.log("Using mock email service for tests:", testApp.mockEmailService);
  });

  afterAll(async () => {
    // Clean up the database
    await clearFixtures(db);
    await tearDownTestDb(db);
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      try {
        // Generate a unique email to avoid conflicts
        const uniqueEmail = `newuser_${Date.now()}@example.com`;
        
        console.log(`Attempting registration with email: ${uniqueEmail}`);
        
        const response = await requestHelper.post("/api/auth/register", {
          name: "New User",
          email: uniqueEmail,
          password: "password123",
        });

        // Log the full response for debugging
        console.log("Registration response:", {
          status: response.status,
          body: JSON.stringify(response.body)
        });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.message).toContain("User registered successfully");
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(uniqueEmail);
        
        // Check that our mock email service was used
        const mockService = (testApp.services.emailService as any);
        console.log("Mock email service sent emails:", mockService.sentEmails);
        expect(mockService.sentEmails.length).toBeGreaterThan(0);
        expect(mockService.sentEmails[0].to).toBe(uniqueEmail);
      } catch (error) {
        console.error("Registration test failed:", error);
        throw error;
      }
    });
  });


  describe("Debug Error Log", () => {
  it("should log the error response to debug registration issues", async () => {
    try {
      // Try registration with debug logs
      const response = await requestHelper.post("/api/auth/register", {
        name: "Debug User",
        email: "debug@example.com",
        password: "password123",
      });

      console.log("Debug response status:", response.status);
      console.log("Debug response body:", JSON.stringify(response.body, null, 2));
      
      // This isn't a real test, just for debugging
      expect(true).toBe(true);
    } catch (error) {
      console.error("Debug test failed:", error);
      // Still pass the test
      expect(true).toBe(true);
    }
  });
});

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      try {
        const response = await requestHelper.post("/api/auth/login", {
          email: "test@example.com",
          password: "password123",
        });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe("test@example.com");

        // Check for refresh token cookie
        expect(response.headers["set-cookie"]).toBeDefined();
        if (response.headers["set-cookie"]) {
          // If it's a string array (most likely case)
          if (Array.isArray(response.headers["set-cookie"])) {
            const cookieStr = response.headers["set-cookie"].join(";");
            expect(cookieStr).toContain("refreshToken=");
          }
          // If it's a single string
          else if (typeof response.headers["set-cookie"] === "string") {
            expect(response.headers["set-cookie"]).toContain("refreshToken=");
          }
        }
      } catch (error) {
        console.error("Login test failed:", error);
        throw error;
      }
    });

    it("should return 401 with incorrect password", async () => {
      try {
        const response = await requestHelper.post("/api/auth/login", {
          email: "test@example.com",
          password: "wrongpassword",
        });

        expect(response.status).toBe(401);
        expect(response.body.status).toBe("error");
      } catch (error) {
        console.error("Invalid password test failed:", error);
        throw error;
      }
    });

    it("should return 401 for unverified users", async () => {
      try {
        const response = await requestHelper.post("/api/auth/login", {
          email: "unverified@example.com",
          password: "unverified",
        });

        expect(response.status).toBe(401);
        expect(response.body.status).toBe("error");
        expect(response.body.message).toContain("not verified");
      } catch (error) {
        console.error("Unverified user test failed:", error);
        throw error;
      }
    });
  });

  describe("POST /api/auth/verify-email", () => {
    it("should verify a user with the correct token", async () => {
      try {
        const response = await requestHelper.post("/api/auth/verify-email", {
          token: "123456", // This is the token for 'unverified@example.com'
        });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.message).toContain("verified successfully");

        // Check that the user is now verified
        const verifiedUser = await db
          .selectFrom("user")
          .select(["is_verified"])
          .where("email", "=", "unverified@example.com")
          .executeTakeFirst();

        expect(verifiedUser?.is_verified).toBe(true);
      } catch (error) {
        console.error("Email verification test failed:", error);
        throw error;
      }
    });

    it("should return 400 with incorrect token", async () => {
      try {
        const response = await requestHelper.post("/api/auth/verify-email", {
          token: "999999", // Wrong token
        });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe("error");
        expect(response.body.message).toContain("Invalid or expired");
      } catch (error) {
        console.error("Invalid token test failed:", error);
        throw error;
      }
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return the current user when authenticated", async () => {
      try {
        // First login to get a token
        const loginResponse = await requestHelper.post("/api/auth/login", {
          email: "test@example.com",
          password: "password123",
        });

        const token = loginResponse.body.data.accessToken;

        // Now get the current user
        const response = await requestHelper.get("/api/auth/me", token);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe("test@example.com");
      } catch (error) {
        console.error("Get current user test failed:", error);
        throw error;
      }
    });

    it("should return 401 when not authenticated", async () => {
      try {
        const response = await requestHelper.get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.status).toBe("error");
      } catch (error) {
        console.error("Unauthenticated test failed:", error);
        throw error;
      }
    });
  });
});