import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import {
  CreateStaffUser,
  StaffUser,
  UpdateStaffUser,
  UserId,
} from '../../core/models/users.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);

  getUsers(): Observable<StaffUser[]> {
    return this.api.get<StaffUser[]>('/users');
  }

  createUser(body: CreateStaffUser): Observable<StaffUser> {
    return this.api.post<StaffUser>('/users', body);
  }

  updateUser(id: UserId, body: UpdateStaffUser): Observable<StaffUser> {
    return this.api.put<StaffUser>(`/users/${id}`, body);
  }
}