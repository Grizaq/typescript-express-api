// src/test/helpers/request-helper.ts
import request from 'supertest';
import { Express } from 'express';

export class RequestTestHelper {
  constructor(private app: Express) {}

  // GET request
  async get(url: string, token?: string) {
    const req = request(this.app).get(url);
    
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  // POST request
  async post(url: string, data: any, token?: string) {
    const req = request(this.app)
      .post(url)
      .send(data);
    
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  // PUT request
  async put(url: string, data: any, token?: string) {
    const req = request(this.app)
      .put(url)
      .send(data);
    
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  // DELETE request
  async delete(url: string, token?: string) {
    const req = request(this.app)
      .delete(url);
    
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }
}