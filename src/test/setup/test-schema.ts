// src/test/setup/test-schema.ts
import { Generated } from 'kysely';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export interface TestDatabase {
  user: {
    id: Generated<number>;
    name: string;
    email: string;
    password: string;
    created_at: Date;
    is_verified: boolean;
    verification_token: string | null;
    verification_expires: Date | null;
    reset_password_token: string | null;
    reset_password_expires: Date | null;
  };

  refresh_token: {
    id: Generated<number>;
    token: string;
    user_id: number;
    expires_at: Date;
    created_at: Date;
    revoked: boolean;
    replaced_by_token: string | null;
    device_name: string | null;
    device_type: string | null;
    browser: string | null;
    ip_address: string | null;
    last_used: Date | null;
  };

  todo: {
    id: Generated<number>;
    title: string;
    description: string | null;
    completed: boolean;
    created_at: Date;
    due_date: Date | null;
    completed_at: Date | null;
    priority: PriorityLevel;
    image_urls: string[];
    user_id: number;
  };
  
  tag: {
    id: Generated<number>;
    name: string;
    created_at: Date;
    user_id: number;
  };
  
  todo_tag: {
    todo_id: number;
    tag_id: number;
  };
}