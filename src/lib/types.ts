export type UserRole = 'student' | 'instructor' | 'tenant_admin' | 'super_admin';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  domain?: string;
  cluster?: string;
  partition_node?: string;
  security_mode?: string;
  storage_usage?: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  knowledge_score?: number;
  created_at: string;
  tenants?: Tenant | null;
}

export interface Course {
  id: string;
  tenant_id: string;
  instructor_id: string;
  title: string;
  code: string;
  description: string;
  created_at: string;
  instructor?: Profile;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  course_id: string;
  name: string;
  created_at: string;
  trust_score?: number;
}

export interface CognitiveProfile {
  id: string;
  student_id: string;
  course_id: string;
  topic_id: string;
  trust_score: number;
  attempt_count: number;
  last_updated: string;
  topics?: {
    id: string;
    name: string;
  };
}

export interface Question {
  id: string;
  course_id: string;
  topic_id: string;
  question_text: string;
  options: string[];
  correct_answer?: string;
  explanation?: string;
  difficulty: number;
  why?: string;
  topic_name?: string;
}

export type ProctorFlagType =
  | 'tab_switch'
  | 'focus_loss'
  | 'eye_diversion'
  | 'mobile_detected'
  | 'multiple_faces'
  | 'face_missing';

export interface ProctoringEvent {
  id: string;
  tenant_id: string;
  course_id: string;
  student_id: string;
  flag_type: ProctorFlagType;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'dismissed' | 'confirmed';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  student?: {
    full_name: string;
    email: string;
  };
  course?: {
    title: string;
    code: string;
  };
}

export interface ClassTopicPulse {
  course_id: string;
  course_title: string;
  topic_id: string;
  topic_name: string;
  avg_trust: number;
  student_count: number;
}
