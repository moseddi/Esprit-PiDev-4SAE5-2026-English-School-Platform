import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Models ───────────────────────────────────────────────────────────────────

export enum AssessmentExamType { EXAM = 'EXAM', TEST = 'TEST', QUIZ = 'QUIZ' }
export enum AssessmentQuestionType { MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', TRUE_FALSE = 'TRUE_FALSE', OPEN = 'OPEN' }

export interface AssessmentUser {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface AssessmentExam {
  id?: number;
  title: string;
  description?: string;
  duration: number;
  examType: AssessmentExamType;
  passingScore: number;
  questions?: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id?: number;
  content: string;
  type: AssessmentQuestionType;
  exam?: { id: number };
  answers?: AssessmentAnswer[];
}

export interface AssessmentAnswer {
  id?: number;
  content: string;
  correct: boolean;
  question?: { id: number };
}

export interface AssessmentAttempt {
  id?: number;
  studentName: string;
  userId?: number;
  score: number;
  passed?: boolean;
  date?: string;
  exam: { id: number; title?: string; passingScore?: number };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AssessmentExamService {

  private readonly BASE = 'http://localhost:8088';
  private readonly USER_BASE = 'http://localhost:8086';
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) { }

  // ── Users (from user-service port 8086) ───────────────────────────────────

  getStudents(): Observable<AssessmentUser[]> {
    return this.http.get<AssessmentUser[]>(`${this.USER_BASE}/users`);
  }

  // ── Exams ──────────────────────────────────────────────────────────────────

  getExams(): Observable<AssessmentExam[]> {
    return this.http.get<AssessmentExam[]>(`${this.BASE}/exams`);
  }

  getExam(id: number): Observable<AssessmentExam> {
    return this.http.get<AssessmentExam>(`${this.BASE}/exams/${id}`);
  }

  createExam(exam: AssessmentExam): Observable<AssessmentExam> {
    return this.http.post<AssessmentExam>(`${this.BASE}/exams`, exam, { headers: this.jsonHeaders });
  }

  updateExam(id: number, exam: AssessmentExam): Observable<AssessmentExam> {
    return this.http.put<AssessmentExam>(`${this.BASE}/exams/${id}`, exam, { headers: this.jsonHeaders });
  }

  deleteExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/exams/${id}`);
  }

  downloadExamPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/exams/${id}/pdf`, { responseType: 'blob' });
  }

  // ── Questions ──────────────────────────────────────────────────────────────

  getQuestions(examId: number): Observable<AssessmentQuestion[]> {
    return this.http.get<AssessmentQuestion[]>(`${this.BASE}/api/questions/exam/${examId}`);
  }

  createQuestion(q: AssessmentQuestion): Observable<AssessmentQuestion> {
    return this.http.post<AssessmentQuestion>(`${this.BASE}/api/questions`, q, { headers: this.jsonHeaders });
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/api/questions/${id}`);
  }

  // ── Answers ────────────────────────────────────────────────────────────────

  getAnswers(questionId: number): Observable<AssessmentAnswer[]> {
    return this.http.get<AssessmentAnswer[]>(`${this.BASE}/api/answers/question/${questionId}`);
  }

  createAnswer(a: AssessmentAnswer): Observable<AssessmentAnswer> {
    return this.http.post<AssessmentAnswer>(`${this.BASE}/api/answers`, a, { headers: this.jsonHeaders });
  }

  deleteAnswer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/api/answers/${id}`);
  }

  // ── Attempts (grades) ──────────────────────────────────────────────────────

  getAttempts(examId: number): Observable<AssessmentAttempt[]> {
    return this.http.get<AssessmentAttempt[]>(`${this.BASE}/attempts/exam/${examId}`);
  }

  /** Fetch all attempts for a student — used by frontoffice espace-notes */
  getAttemptsByUser(userId: number): Observable<AssessmentAttempt[]> {
    return this.http.get<AssessmentAttempt[]>(`${this.BASE}/attempts/user/${userId}`);
  }

  createAttempt(a: AssessmentAttempt): Observable<AssessmentAttempt> {
    return this.http.post<AssessmentAttempt>(`${this.BASE}/attempts`, a, { headers: this.jsonHeaders });
  }

  deleteAttempt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/attempts/${id}`);
  }

  downloadCertificate(attemptId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/attempts/${attemptId}/certificate`, { responseType: 'blob' });
  }

  // ── Submit Exam (auto-scoring) ─────────────────────────────────────────────

  submitExam(payload: SubmitExamPayload): Observable<AssessmentAttempt> {
    return this.http.post<AssessmentAttempt>(
      `${this.BASE}/attempts/submit`, payload, { headers: this.jsonHeaders }
    );
  }
}

// ─── Submit Exam Payload ──────────────────────────────────────────────────────

export interface SubmitExamPayload {
  examId: number;
  userId: number;
  studentName: string;
  answers: { questionId: number; answerId: number }[];
}
