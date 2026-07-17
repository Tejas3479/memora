export interface Comment {
  id: string;
  userId: string;
  memoryId: string;
  content: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string; email: string };
}

export interface CommentCreateRequest {
  memoryId: string;
  content: string;
  parentId?: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}
